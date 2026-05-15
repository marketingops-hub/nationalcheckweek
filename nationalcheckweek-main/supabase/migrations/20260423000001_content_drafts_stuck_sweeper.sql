-- ═══════════════════════════════════════════════════════════════════════════
-- Stuck-draft sweeper — belt-and-braces cleanup for content_drafts rows
-- the edge fn stranded in 'generating' or 'verifying'.
--
-- Root cause the sweeper defends against:
--   The content-creator-generate / -verify edge fns flip status to the
--   in-flight state BEFORE starting the AI chain. If Supabase SIGKILLs
--   the Deno worker at its 150s wall-clock cap (or for OOM), the catch
--   block that was supposed to roll the status back never runs. The
--   row is left marooned at 'generating' | 'verifying' forever.
--
--   The edge fn itself now carries per-call AbortSignal budgets on
--   OpenAI + Anthropic (see _shared/content-creator/openai.ts::
--   OpenAIOpts.timeoutMs) which fixes the *common* case where
--   upstream is slow but still responsive. This migration catches
--   the residual: hard crashes, Deno OOMs, Supabase supervisor kills,
--   and any future failure mode we haven't identified yet.
--
-- Behaviour:
--   • Runs every minute via pg_cron
--   • Targets rows stuck in 'generating' or 'verifying' for > 5 min
--   • Rolls 'generating' back to 'approved_idea' (no body produced)
--     or 'draft' (body present from a regen, preserve it for edit)
--   • Rolls 'verifying' back to 'draft' (verification is re-runnable)
--   • Stamps ai_metadata.last_error so the admin sees why it moved —
--     same shape the edge fn's own catch block writes on normal failures
--
-- Idempotency:
--   The function is CREATE OR REPLACE and the cron job is scheduled
--   with ON CONFLICT-safe pattern. Safe to re-run this migration.
--   Guards prevent stacking duplicate cron entries.
-- ═══════════════════════════════════════════════════════════════════════════

-- pg_cron is enabled on all Supabase projects by default, but be explicit
-- so running this migration against a fresh local Supabase works too.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- The sweeper. Written as a plpgsql function (not raw SQL in the cron
-- schedule) so that we can add logging / NOTIFY later without having
-- to re-schedule the job. Also gives us a single entry point for an
-- admin to invoke manually: SELECT sweep_stuck_drafts();
CREATE OR REPLACE FUNCTION public.sweep_stuck_drafts()
RETURNS TABLE (swept_id uuid, swept_from text, swept_to text) AS $$
BEGIN
  -- Snapshot stuck rows first so we can report pre-update status after
  -- the UPDATE runs. UPDATE...RETURNING only exposes post-update values,
  -- and a straight CASE-inverse isn't safe once we've committed the new
  -- status. The CTE + UPDATE ... FROM pattern is the canonical fix.
  RETURN QUERY
  WITH stuck AS (
    SELECT
      cd.id,
      cd.status AS original_status,
      CASE
        -- 'generating': preserve a partial body if the edge fn got far
        -- enough to write one (Request-improvement path); otherwise
        -- send back to 'approved_idea' so the admin can retry.
        WHEN cd.status = 'generating' AND COALESCE(length(cd.body), 0) > 0 THEN 'draft'
        WHEN cd.status = 'generating'                                      THEN 'approved_idea'
        -- 'verifying': verification is stateless and idempotent — always
        -- safe to roll back to 'draft'. Body + verification untouched.
        WHEN cd.status = 'verifying'                                       THEN 'draft'
      END AS new_status
    FROM public.content_drafts cd
    WHERE cd.status IN ('generating', 'verifying')
      AND cd.updated_at < now() - interval '5 minutes'
    -- FOR UPDATE to serialise against a concurrent edge-fn success that
    -- races the sweeper. If the edge fn commits first, its row is no
    -- longer in ('generating','verifying') and we won't touch it.
    FOR UPDATE SKIP LOCKED
  ),
  updated AS (
    UPDATE public.content_drafts cd
    SET
      status = stuck.new_status,
      ai_metadata = COALESCE(cd.ai_metadata, '{}'::jsonb)
        || jsonb_build_object(
             'last_error',          'Swept by sweep_stuck_drafts: stuck >5min in status='
                                    || stuck.original_status,
             'last_error_at',       to_char(now() at time zone 'UTC',
                                            'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
             'last_error_stage',    'sweeper',
             'last_error_request_id', NULL
           ),
      updated_at = now()
    FROM stuck
    WHERE cd.id = stuck.id
    RETURNING cd.id, stuck.original_status, stuck.new_status
  )
  SELECT id, original_status, new_status FROM updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop any prior schedule of the same name before re-adding it so this
-- migration is idempotent under re-runs. pg_cron doesn't have a native
-- "upsert schedule" — the guard pattern is the documented workaround.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sweep_stuck_drafts_every_minute') THEN
    PERFORM cron.unschedule('sweep_stuck_drafts_every_minute');
  END IF;
END $$;

SELECT cron.schedule(
  'sweep_stuck_drafts_every_minute',
  '* * * * *',
  $$SELECT public.sweep_stuck_drafts();$$
);

COMMENT ON FUNCTION public.sweep_stuck_drafts() IS
  'Rolls content_drafts rows stuck in generating/verifying > 5 min back to '
  'a user-actionable status. Runs every minute via the cron job '
  '"sweep_stuck_drafts_every_minute". See migration 20260423000001 for the '
  'full rationale — primarily guards against Supabase edge-fn wall-clock '
  'SIGKILLs that bypass the edge-fn''s own cleanup catch block.';
