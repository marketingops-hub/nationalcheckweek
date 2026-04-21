"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * MetaPanel — provenance / ai_metadata sidebar card.
 *
 * Surfaces the things an admin needs to debug a run:
 *   - which models produced this draft
 *   - total tokens
 *   - vault refs count
 *   - created / updated timestamps
 *   - drift_warnings from the improve/verify passes
 *   - last_error + last_error_stage when an edge fn threw
 *
 * The `ai_metadata` column is loosely-typed JSON on the DB side, so we
 * widen-then-narrow (`as unknown as Record<string, unknown>`) to pick
 * out fields the TS AIMetadata type doesn't yet enumerate. When we add
 * a field to AIMetadata we can drop the cast.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { ContentDraft } from "@/lib/content-creator/types";
import { formatUsd } from "@/lib/content-creator/pricing";

export function MetaPanel({ draft }: { draft: ContentDraft }) {
  const m = draft.ai_metadata ?? {};
  const metaUnknown = m as unknown as Record<string, unknown>;

  const driftWarnings = Array.isArray(metaUnknown.drift_warnings)
    ? (metaUnknown.drift_warnings as string[])
    : [];
  const lastError = typeof metaUnknown.last_error === 'string'
    ? (metaUnknown.last_error as string)
    : null;
  const lastErrorStage = typeof metaUnknown.last_error_stage === 'string'
    ? (metaUnknown.last_error_stage as string)
    : null;

  /* ─── Apr 2026 additions — length / latency / cost ────────────────────── */

  const wordCount = typeof metaUnknown.word_count === 'number'
    ? (metaUnknown.word_count as number)
    : null;
  const charCount = typeof metaUnknown.char_count === 'number'
    ? (metaUnknown.char_count as number)
    : null;
  const charLimitExceeded = metaUnknown.char_limit_exceeded === true;

  // Length-retry telemetry — present only when the length gate kicked in.
  // Shape: { first_count, final_count, direction: 'short' | 'long' | 'ok' }.
  const lengthRetry = metaUnknown.length_retry && typeof metaUnknown.length_retry === 'object'
    ? metaUnknown.length_retry as { first_count: number; final_count: number; direction: string }
    : null;

  const latency = metaUnknown.latency_ms && typeof metaUnknown.latency_ms === 'object'
    ? metaUnknown.latency_ms as { vault?: number; openai?: number; anthropic?: number; total?: number }
    : null;

  const costUsd = typeof metaUnknown.cost_usd === 'number'
    ? (metaUnknown.cost_usd as number)
    : null;
  const costPartial = metaUnknown.cost_partial === true;

  return (
    <div style={{
      background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
      padding: 16, fontSize: 12, color: '#6B7280',
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E1040', marginBottom: 10 }}>
        Provenance
      </h3>

      <dl style={{
        display: 'grid', gridTemplateColumns: 'auto 1fr',
        gap: '4px 10px', margin: 0,
      }}>
        <dt>OpenAI</dt>     <dd>{m.openai_model ?? '—'}</dd>
        <dt>Anthropic</dt>  <dd>{m.anthropic_model ?? '—'}</dd>
        <dt>Tokens</dt>     <dd>{m.tokens?.total ?? '—'}</dd>
        <dt>Cost</dt>       <dd>{costUsd != null
          ? `${costPartial ? '~' : ''}${formatUsd(costUsd)}`
          : '—'}</dd>
        <dt>Vault refs</dt> <dd>{(draft.vault_refs ?? []).length}</dd>
        <dt>Style</dt>      <dd>{(metaUnknown.style_title as string | undefined) ?? '—'}</dd>
        {draft.content_type !== 'social' && wordCount != null && (
          <>
            <dt>Words</dt>
            <dd>
              {wordCount}
              {lengthRetry && (
                <span style={{
                  marginLeft: 6, fontSize: 10,
                  padding: '1px 6px', borderRadius: 4,
                  background: '#EEF2FF', color: '#4338CA',
                }}>
                  retried {lengthRetry.direction}
                </span>
              )}
            </dd>
          </>
        )}
        {draft.content_type === 'social' && charCount != null && (
          <>
            <dt>Chars</dt>
            <dd style={charLimitExceeded ? { color: '#B91C1C' } : undefined}>
              {charCount}{charLimitExceeded ? ' (over limit)' : ''}
            </dd>
          </>
        )}
        <dt>Created</dt>    <dd>{new Date(draft.created_at).toLocaleString()}</dd>
        <dt>Updated</dt>    <dd>{new Date(draft.updated_at).toLocaleString()}</dd>
      </dl>

      {/* Stage latency bar. Only shown once we have a latency_ms object; the
          segments are proportional so a quick glance tells you which stage
          dominated the run. Vault fetch is usually fastest, OpenAI longest. */}
      {latency && (latency.total ?? 0) > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#6B7280',
            textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
          }}>
            Stage latency ({((latency.total ?? 0) / 1000).toFixed(1)}s)
          </div>
          <LatencyBar latency={latency} />
        </div>
      )}

      {/* Finalization stamp — appears after a human signs off on a
          verified draft. Kept in the provenance card rather than the
          verifier card because it's an audit signal about who, not what. */}
      {draft.verification?.approved_at && (
        <div style={{
          marginTop: 12, padding: 8,
          background: '#ECFDF5', borderLeft: '3px solid #10B981', borderRadius: 4,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#047857',
            marginBottom: 2, textTransform: 'uppercase',
          }}>
            Finalized
          </div>
          <div style={{ fontSize: 12, color: '#065F46' }}>
            {new Date(draft.verification.approved_at as unknown as string).toLocaleString()}
          </div>
        </div>
      )}

      {driftWarnings.length > 0 && (
        <div style={{
          marginTop: 12, padding: 8,
          background: '#FFFBEB', borderLeft: '3px solid #F59E0B', borderRadius: 4,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#B45309',
            marginBottom: 4, textTransform: 'uppercase',
          }}>
            Drift warnings ({driftWarnings.length})
          </div>
          {driftWarnings.map((w, i) => (
            <div key={i} style={{ fontSize: 12, color: '#78350F', marginTop: 2 }}>• {w}</div>
          ))}
        </div>
      )}

      {lastError && (
        <div style={{
          marginTop: 12, padding: 8,
          background: '#FEF2F2', borderLeft: '3px solid #EF4444', borderRadius: 4,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#B91C1C',
            marginBottom: 4, textTransform: 'uppercase',
          }}>
            Last error{lastErrorStage ? ` (${lastErrorStage})` : ''}
          </div>
          <div style={{ fontSize: 12, color: '#991B1B' }}>{lastError}</div>
        </div>
      )}
    </div>
  );
}

/**
 * Stacked horizontal bar showing the share of total wall-clock spent in
 * each stage. Segments are plain divs with flex-basis = (ms / total)%.
 * We only render segments > 2% to keep the legend readable.
 */
function LatencyBar({
  latency,
}: {
  latency: { vault?: number; openai?: number; anthropic?: number; total?: number };
}) {
  const total = latency.total ?? 0;
  if (total <= 0) return null;
  const segs: Array<{ label: string; ms: number; color: string }> = [
    { label: 'Vault',     ms: latency.vault     ?? 0, color: '#A78BFA' },
    { label: 'OpenAI',    ms: latency.openai    ?? 0, color: '#5925F4' },
    { label: 'Anthropic', ms: latency.anthropic ?? 0, color: '#EC4899' },
  ];

  return (
    <>
      <div style={{
        display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden',
        background: '#F3F4F6',
      }}>
        {segs.map((s) => {
          const pct = (s.ms / total) * 100;
          if (pct < 0.1) return null;
          return (
            <div
              key={s.label}
              title={`${s.label}: ${(s.ms / 1000).toFixed(2)}s`}
              style={{ width: `${pct}%`, background: s.color }}
            />
          );
        })}
      </div>
      <div style={{
        display: 'flex', gap: 10, marginTop: 6, fontSize: 11, color: '#6B7280',
        flexWrap: 'wrap',
      }}>
        {segs.filter((s) => s.ms > 0).map((s) => (
          <span key={s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              width: 8, height: 8, borderRadius: 2, background: s.color,
            }} />
            {s.label}: {(s.ms / 1000).toFixed(2)}s
          </span>
        ))}
      </div>
    </>
  );
}
