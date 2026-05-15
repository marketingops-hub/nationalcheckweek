"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * useDraftDetail — all data + state + side-effects for the /[id] page.
 *
 * This used to live inline in page.tsx. Extracted so the page component is
 * a thin orchestrator and the business logic is independently testable
 * (no JSX, no DOM — easy to mock).
 *
 * Behaviour preserved verbatim from the pre-refactor page:
 *   - Fetch on mount + on id change.
 *   - Poll every 3s while status is 'generating' | 'verifying'.
 *   - Cap the poll loop at MAX_POLLS so a stalled edge fn can't trap the
 *     UI in an infinite refresh; flip `stuck=true` and expose a retry.
 *   - Auto-approve before generate when the row is still an idea.
 *   - Save-before-verify so the verifier sees the on-screen edits.
 *   - Copy / download emit plain-text + markdown-formatted bodies.
 *
 * "Copied to clipboard" is reused as the success path through the same
 * `error` slot the page already renders — we deliberately keep the
 * single-message UX rather than introducing a toast system for one line.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getDraft,
  patchDraft,
  generateDraft,
  verifyDraft,
  archiveDraft,
  deleteDraft,
  approveIdea,
  unapproveIdea,
  finalizeDraft,
  regenerateDraft,
  publishDraftToBlog,
  publishDraftToPages,
  recoverStuckDraft,
} from "@/lib/content-creator/client";
import type {
  ContentDraft, ContentType, SocialPlatform,
} from "@/lib/content-creator/types";
import { stripHashHeadings } from "@/lib/content-creator/length";

/** Input shape for the BriefSettingsPanel. Every field optional — the
 *  panel sends only what actually changed. */
export interface BriefMetaPatch {
  content_type?: ContentType;
  platform?:     SocialPlatform | null;
  include_title?: boolean;
  style_id?:     string | null;
}

/** Max poll ticks before we declare the row stuck. 30 × 3s = 90s, which
 *  gives 3× headroom over the edge fn's ~60s max runtime. */
const MAX_POLLS = 30;
const POLL_INTERVAL_MS = 3000;

export type DraftBusy = null | 'generate' | 'verify' | 'save' | 'finalize' | 'regenerate' | 'meta' | 'publish';

export interface UseDraftDetail {
  /** Loaded draft, or null while fetching / if not found. */
  draft:     ContentDraft | null;
  loading:   boolean;
  /** Which action (if any) is currently running. Mutually exclusive. */
  busy:      DraftBusy;
  /** Error string OR the "Copied to clipboard" success message. */
  error:     string;
  /** True when polling has exceeded MAX_POLLS — shows the recovery CTA. */
  stuck:     boolean;
  /** How long we waited before declaring stuck, in seconds — for the UI. */
  stuckAfterSeconds: number;

  /** Local editable title. Empty string when draft.title is null. */
  title:     string;
  setTitle:  (t: string) => void;
  body:      string;
  setBody:   (b: string) => void;

  refresh:      () => Promise<void>;
  doGenerate:   () => Promise<void>;
  doSave:       () => Promise<void>;
  doVerify:     () => Promise<void>;
  doArchive:    () => Promise<void>;
  doDelete:     () => Promise<void>;
  doUnapprove:  () => Promise<void>;
  /** Human sign-off on a verified draft (status stays 'verified';
   *  verification.approved_at gets stamped). */
  doFinalize:   () => Promise<void>;
  /** Request-improvement flow: saves feedback in brief and kicks off
   *  a regeneration pass. Fires from draft / verified / rejected. */
  doRegenerate: (feedback: string) => Promise<void>;
  /** Publish a finalized blog draft into the CMS-side `blog_posts` table
   *  as an unpublished draft. No-ops (and surfaces an error) for non-blog
   *  or non-finalized drafts. */
  doPublishToBlog: () => Promise<void>;
  /** GEO equivalent — publishes a finalized GEO draft into cms_pages with
   *  category='geo'. No-ops (and surfaces an error) for non-GEO or
   *  non-finalized drafts. */
  doPublishToPages: () => Promise<void>;
  /** Patch the meta bar (content_type / platform / include_title / style_id).
   *  Returns true on success so the UI can close its editor cleanly. */
  patchMeta:    (patch: BriefMetaPatch) => Promise<boolean>;
  copyBody:     () => Promise<void>;
  downloadMd:   () => void;
  /** Recover a draft that the edge fn stranded in 'generating' /
   *  'verifying'. Server enforces a 5-minute minimum stuck age so this
   *  can't race a real in-flight AI call; on too-early clicks it
   *  surfaces the wait-time hint in `error`. */
  retryFromStuck: () => Promise<void>;
}

export function useDraftDetail(id: string): UseDraftDetail {
  const router = useRouter();

  const [draft,   setDraft]   = useState<ContentDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy,    setBusy]    = useState<DraftBusy>(null);
  const [error,   setError]   = useState("");
  const [stuck,   setStuck]   = useState(false);

  // Local editable copies so the textarea doesn't jank on every poll.
  const [title, setTitle] = useState<string>("");
  const [body,  setBody]  = useState<string>("");

  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  /* ─── Core fetch ──────────────────────────────────────────────────────── */

  const refresh = useCallback(async () => {
    try {
      const d = await getDraft(id);
      setDraft(d);
      setTitle(d.title ?? "");
      // body is TEXT NOT NULL DEFAULT '' but defend against partial rows
      // the page previously crashed on.
      // Legacy drafts may contain '#' markdown headings that our CMS
      // renders as literal hashes. Sanitize on load — promotes them to
      // bold and leaves the rest of the body untouched.
      setBody(typeof d.body === 'string' ? stripHashHeadings(d.body) : "");
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { refresh(); }, [refresh]);

  /* ─── Auto-poll while a stage is in flight ────────────────────────────── */

  useEffect(() => {
    if (!draft) return;
    const inFlight = draft.status === 'generating' || draft.status === 'verifying';

    if (inFlight && !pollRef.current) {
      pollCountRef.current = 0;
      setStuck(false);
      pollRef.current = setInterval(() => {
        pollCountRef.current += 1;
        if (pollCountRef.current > MAX_POLLS) {
          // Stop polling and surface a recovery CTA.
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          setStuck(true);
          return;
        }
        refresh();
      }, POLL_INTERVAL_MS);
    }

    if (!inFlight && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
      pollCountRef.current = 0;
    }

    return () => {
      if (pollRef.current && !inFlight) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [draft, refresh]);

  /* ─── Actions ─────────────────────────────────────────────────────────── */

  const doGenerate = useCallback(async () => {
    if (!draft) return;
    setBusy('generate'); setError("");
    try {
      // "idea → approved_idea → generating" jump: the API layer returns
      // 409 if you skip steps, so approve first when needed.
      if (draft.status === 'idea') {
        await approveIdea(draft.id);
      }
      await generateDraft(draft.id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, [draft, refresh]);

  const doSave = useCallback(async () => {
    if (!draft) return;
    setBusy('save'); setError("");
    try {
      const patch: { title?: string | null; body?: string } = { body };
      if (draft.content_type !== 'social') patch.title = title;
      await patchDraft(draft.id, patch);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, [draft, title, body, refresh]);

  const doVerify = useCallback(async () => {
    if (!draft) return;
    setBusy('verify'); setError("");
    try {
      // Save any unsaved edits first so the verifier sees what's on-screen.
      await patchDraft(draft.id, {
        body,
        title: draft.content_type === 'social' ? null : title,
      });
      await verifyDraft(draft.id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, [draft, title, body, refresh]);

  const doArchive = useCallback(async () => {
    if (!draft) return;
    if (!confirm("Archive this draft? You can find it later under Archived.")) return;
    try {
      await archiveDraft(draft.id);
      router.push('/admin/content-creator');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [draft, router]);

  const doDelete = useCallback(async () => {
    if (!draft) return;
    if (!confirm(
      "Delete this draft permanently?\n\n" +
      "This cannot be undone. If you just want to hide it, use Archive instead.",
    )) return;
    try {
      await deleteDraft(draft.id);
      router.push('/admin/content-creator');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [draft, router]);

  const doFinalize = useCallback(async () => {
    if (!draft) return;
    setBusy('finalize'); setError("");
    try {
      const updated = await finalizeDraft(draft.id);
      setDraft(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, [draft]);

  /* Push a finalized blog draft into /admin/blog as an unpublished row.
   * Server is the source of truth for the content_type / finalized gates,
   * but we check them here too so the UI can hide the button altogether
   * when it wouldn't work. The success path re-uses the `error` slot for
   * a toast-style message — matches the pattern copyBody already uses. */
  const doPublishToBlog = useCallback(async () => {
    if (!draft) return;
    setBusy('publish'); setError("");
    try {
      const { created } = await publishDraftToBlog(draft.id);
      setError(created
        ? 'Published to /admin/blog as draft. Go there to make it live.'
        : 'Updated the existing blog post on /admin/blog.');
      setTimeout(() => setError(""), 3500);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, [draft]);

  /* GEO equivalent — publishes into cms_pages under category='geo'. Same
   * "error slot = toast" pattern as publishToBlog. */
  const doPublishToPages = useCallback(async () => {
    if (!draft) return;
    setBusy('publish'); setError("");
    try {
      const { created } = await publishDraftToPages(draft.id);
      setError(created
        ? 'Published to /admin/cms/pages as draft. Go there to make it live.'
        : 'Updated the existing GEO page on /admin/cms/pages.');
      setTimeout(() => setError(""), 3500);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, [draft]);

  const doRegenerate = useCallback(async (feedback: string) => {
    if (!draft) return;
    const clean = feedback.trim();
    if (clean.length < 3) {
      setError('Feedback must be at least 3 characters.');
      return;
    }
    setBusy('regenerate'); setError("");
    try {
      // Save any pending on-screen edits first so the regenerator sees
      // them as the "previous draft". Without this, a user who typed
      // edits then asked for improvement would get the model rewriting
      // the pre-edit version.
      if (draft.status === 'draft' || draft.status === 'verified' || draft.status === 'rejected') {
        await patchDraft(draft.id, {
          body,
          title: draft.content_type === 'social' ? null : title,
        });
      }
      await regenerateDraft(draft.id, clean);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, [draft, title, body, refresh]);

  const patchMeta = useCallback(async (patch: BriefMetaPatch): Promise<boolean> => {
    if (!draft) return false;
    setBusy('meta'); setError("");
    try {
      // Split the flat panel shape into the server's PATCH shape.
      // include_title + style_id live under brief_patch; content_type
      // and platform are top-level (they affect the draft row directly).
      const serverPatch: Parameters<typeof patchDraft>[1] = {};
      if (patch.content_type) serverPatch.content_type = patch.content_type;
      if ('platform' in patch) serverPatch.platform    = patch.platform;

      const briefPatch: Record<string, unknown> = {};
      if ('include_title' in patch && patch.include_title !== undefined) {
        briefPatch.include_title = patch.include_title;
      }
      if ('style_id' in patch) {
        // Empty string or null both mean "unset" — omit the brief key
        // entirely so Zod's .uuid() doesn't reject it.
        if (patch.style_id) briefPatch.style_id = patch.style_id;
      }
      if (Object.keys(briefPatch).length > 0) {
        serverPatch.brief_patch = briefPatch;
      }

      // If switching OUT of social and the title is empty, carry the
      // on-screen title through so the server's "long-form requires a
      // title" rule doesn't 400 us.
      if (patch.content_type && patch.content_type !== 'social'
          && draft.content_type === 'social' && !draft.title) {
        serverPatch.title = title || 'Untitled';
      }

      const updated = await patchDraft(draft.id, serverPatch);
      setDraft(updated);
      setTitle(updated.title ?? "");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      setBusy(null);
    }
  }, [draft, title]);

  const doUnapprove = useCallback(async () => {
    if (!draft) return;
    try {
      const updated = await unapproveIdea(draft.id);
      setDraft(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [draft]);

  const copyBody = useCallback(async () => {
    if (!draft) return;
    const rawBody  = typeof draft.body === 'string' ? draft.body : '';
    // Strip '#' heading sigils from the body (blog + newsletter) so the
    // clipboard payload matches what the admin sees in the editor. The
    // title prepend below stays a single '# ' because downstream markdown
    // readers expect that as the document root.
    const safeBody = stripHashHeadings(rawBody);
    const text = draft.content_type === 'social'
      ? safeBody
      : `# ${draft.title ?? ''}\n\n${safeBody}`;
    await navigator.clipboard.writeText(text);
    // Minimal feedback via the existing error slot — no toast library yet.
    setError("Copied to clipboard");
    setTimeout(() => setError(""), 1500);
  }, [draft]);

  const downloadMd = useCallback(() => {
    if (!draft) return;
    const rawBody  = typeof draft.body === 'string' ? draft.body : '';
    // See copyBody above for why we sanitize before emitting.
    const safeBody = stripHashHeadings(rawBody);
    const text = draft.content_type === 'social'
      ? safeBody
      : `# ${draft.title ?? ''}\n\n${safeBody}`;
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${draft.content_type}-${draft.id.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [draft]);

  /* Stuck-row recovery. Previously this just hid the banner and
   * re-fetched the row — which did nothing if the edge fn had truly
   * hung. We now call /recover which flips the row back to the
   * pre-in-flight editable state (server enforces a 5-minute minimum
   * stuck age so we can't race a real request). On the rare
   * pre-5-minute click, the server 409s and we surface a helpful hint
   * via the shared `error` slot. */
  const retryFromStuck = useCallback(async () => {
    if (!draft) { setStuck(false); return; }
    setBusy('generate'); setError("");
    try {
      const { recovered_from, recovered_to } = await recoverStuckDraft(draft.id);
      setStuck(false);
      await refresh();
      setError(`Recovered: ${recovered_from} → ${recovered_to}. You can retry now.`);
      setTimeout(() => setError(""), 4000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // 409 (too early) means the edge fn may still be running —
      // tell the admin to wait rather than scaring them with a raw
      // "Cannot recover" string.
      setError(
        /Wait at least/.test(msg)
          ? msg
          : `Recovery failed: ${msg}`,
      );
    } finally {
      setBusy(null);
    }
  }, [draft, refresh]);

  return {
    draft, loading, busy, error, stuck,
    stuckAfterSeconds: (MAX_POLLS * POLL_INTERVAL_MS) / 1000,
    title, setTitle, body, setBody,
    refresh,
    doGenerate, doSave, doVerify, doArchive, doDelete, doUnapprove,
    doFinalize, doRegenerate, doPublishToBlog, doPublishToPages, patchMeta,
    copyBody, downloadMd,
    retryFromStuck,
  };
}
