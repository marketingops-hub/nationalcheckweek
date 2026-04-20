"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * /admin/content-creator/[id]
 *
 * Single-draft detail page. Behaviour depends on status:
 *   • idea           → show brief, approve → generate full content
 *   • approved_idea  → "Generate content" button (stage 2)
 *   • generating     → live spinner + auto-poll
 *   • draft | rejected → editable title + body + Verify button
 *   • verifying      → live spinner + auto-poll
 *   • verified       → read-only + Copy/Download + "Unlock to edit"
 *   • archived       → read-only
 *
 * All heavy lifting is in the API route / edge fn; this file only wires
 * state transitions into the client helpers.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getDraft,
  patchDraft,
  generateDraft,
  verifyDraft,
  archiveDraft,
} from "@/lib/content-creator/client";
import { PLATFORM_CONFIG } from "@/lib/content-creator/platforms";
import type { ContentDraft, FlaggedClaim, SupportedClaim } from "@/lib/content-creator/types";

export default function DraftDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [draft, setDraft] = useState<ContentDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<null | 'generate' | 'verify' | 'save'>(null);
  const [error, setError] = useState("");

  // Local editable copies so the textarea doesn't jank on every poll.
  const [title, setTitle] = useState<string>("");
  const [body,  setBody]  = useState<string>("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const d = await getDraft(id);
      setDraft(d);
      setTitle(d.title ?? "");
      setBody(d.body);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { refresh(); }, [refresh]);

  // Auto-poll while a stage is in flight.
  useEffect(() => {
    if (!draft) return;
    const inFlight = draft.status === 'generating' || draft.status === 'verifying';
    if (inFlight && !pollRef.current) {
      pollRef.current = setInterval(refresh, 3000);
    }
    if (!inFlight && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current && !inFlight) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [draft, refresh]);

  /* ─── Actions ─────────────────────────────────────────────────────────── */

  async function doGenerate() {
    if (!draft) return;
    setBusy('generate'); setError("");
    try {
      // Also covers the "idea → approved_idea → generating" jump — the API
      // layer returns 409 if you skip steps, so we approve first if needed.
      if (draft.status === 'idea') {
        const { approveIdea } = await import('@/lib/content-creator/client');
        await approveIdea(draft.id);
      }
      await generateDraft(draft.id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function doSave() {
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
  }

  async function doVerify() {
    if (!draft) return;
    setBusy('verify'); setError("");
    try {
      // Save any unsaved edits first so the verifier sees what's on screen.
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
  }

  async function doArchive() {
    if (!draft) return;
    if (!confirm("Archive this draft?")) return;
    try {
      await archiveDraft(draft.id);
      router.push('/admin/content-creator');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function copyBody() {
    if (!draft) return;
    const text = draft.content_type === 'social'
      ? draft.body
      : `# ${draft.title ?? ''}\n\n${draft.body}`;
    await navigator.clipboard.writeText(text);
    // minimal feedback — no toast library yet
    setError("✓ Copied to clipboard");
    setTimeout(() => setError(""), 1500);
  }

  function downloadMd() {
    if (!draft) return;
    const text = draft.content_type === 'social'
      ? draft.body
      : `# ${draft.title ?? ''}\n\n${draft.body}`;
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${draft.content_type}-${draft.id.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ─── Render ──────────────────────────────────────────────────────────── */

  if (loading) return <div style={{ padding: 40, color: '#9CA3AF' }}>Loading…</div>;
  if (!draft) return <div className="swa-alert swa-alert--error">Draft not found.</div>;

  const isEditable =
    draft.status === 'draft' || draft.status === 'rejected' ||
    draft.status === 'approved_idea' || draft.status === 'idea' ||
    draft.status === 'verified';  // verified edits demote it back to draft
  const inFlight = busy !== null || draft.status === 'generating' || draft.status === 'verifying';
  const charLimit = draft.content_type === 'social' && draft.platform
    ? PLATFORM_CONFIG[draft.platform].maxChars
    : undefined;

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="swa-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Link href="/admin/content-creator" style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none' }}>
              ← Content Creator
            </Link>
            <span style={{ color: '#D1D5DB' }}>·</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>
              {draft.content_type}{draft.platform ? ` / ${draft.platform}` : ''}
            </span>
          </div>
          <h1 className="swa-page-title">
            {draft.title ?? ((draft.body.slice(0, 60) + (draft.body.length > 60 ? '…' : '')) || '(untitled)')}
          </h1>
          <p className="swa-page-subtitle">
            Status: <strong>{draft.status}</strong> · Topic: {draft.brief.topic}
          </p>
        </div>
        <button onClick={doArchive} className="swa-btn" style={{ color: '#EF4444' }}>
          Archive
        </button>
      </div>

      {error && (
        <div
          className={`swa-alert ${error.startsWith('✓') ? 'swa-alert--success' : 'swa-alert--error'}`}
          style={{ marginBottom: 20 }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* ── Main editor ─────────────────────────────────────────────── */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: 12,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {draft.content_type !== 'social' && (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!isEditable || inFlight}
              placeholder="Title"
              style={{
                fontSize: 22,
                fontWeight: 700,
                padding: '10px 12px',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                color: '#1E1040',
              }}
            />
          )}

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={!isEditable || inFlight}
            rows={draft.content_type === 'social' ? 6 : 18}
            placeholder={
              draft.status === 'idea'
                ? 'This is the idea summary. Approve + Generate to produce full content.'
                : 'Write / edit the body here. Every claim must be backed by a Vault entry.'
            }
            style={{
              padding: '12px 14px',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              fontSize: 14,
              fontFamily: 'inherit',
              lineHeight: 1.6,
              resize: 'vertical',
              minHeight: 180,
            }}
          />

          {charLimit && (
            <div style={{ fontSize: 12, color: body.length > charLimit ? '#B91C1C' : '#6B7280' }}>
              {body.length} / {charLimit} chars
            </div>
          )}

          {/* Action row */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            {(draft.status === 'idea' || draft.status === 'approved_idea') && (
              <button onClick={doGenerate} disabled={inFlight} className="swa-btn swa-btn--primary">
                {busy === 'generate' ? 'Generating…' : '✨ Generate content'}
              </button>
            )}

            {(draft.status === 'draft' || draft.status === 'rejected') && (
              <>
                <button onClick={doSave} disabled={inFlight} className="swa-btn">
                  {busy === 'save' ? 'Saving…' : 'Save'}
                </button>
                <button onClick={doVerify} disabled={inFlight} className="swa-btn swa-btn--primary">
                  {busy === 'verify' ? 'Verifying…' : '🔍 Verify against Vault'}
                </button>
              </>
            )}

            {draft.status === 'verified' && (
              <>
                <button onClick={copyBody} className="swa-btn swa-btn--primary">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>content_copy</span>
                  Copy
                </button>
                <button onClick={downloadMd} className="swa-btn">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                  Download .md
                </button>
                <button onClick={doSave} className="swa-btn">
                  Edit (demotes to draft)
                </button>
              </>
            )}

            {draft.status === 'generating' && <Spinner label="Writing draft…" />}
            {draft.status === 'verifying' && <Spinner label="Checking claims against Vault…" />}
          </div>
        </div>

        {/* ── Sidebar: verification + metadata ─────────────────────────── */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <VerificationPanel draft={draft} />
          <MetaPanel draft={draft} />
        </aside>
      </div>
    </div>
  );
}

/* ─── Subcomponents ─────────────────────────────────────────────────────── */

function Spinner({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4338CA', fontSize: 14 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18, animation: 'spin 1.2s linear infinite' }}>
        progress_activity
      </span>
      {label}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function VerificationPanel({ draft }: { draft: ContentDraft }) {
  const v = draft.verification ?? {};
  const supported = (v.supported_claims ?? []) as SupportedClaim[];
  const flagged   = (v.flagged_claims   ?? []) as FlaggedClaim[];

  const hasRun = draft.status === 'verified' || draft.status === 'rejected' || !!v.status;

  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E1040', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>fact_check</span>
        Vault verification
      </h3>

      {!hasRun ? (
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
          Not yet verified. Run Verify once the draft is ready to cross-check every factual claim against the Vault.
        </p>
      ) : (
        <>
          <div style={{ marginBottom: 10 }}>
            <StatusBadge status={v.status ?? 'unverified'} />
            {v.confidence && (
              <span style={{ marginLeft: 8, fontSize: 12, color: '#6B7280' }}>
                confidence: {v.confidence}
              </span>
            )}
          </div>
          {v.notes && <p style={{ fontSize: 13, color: '#374151', marginBottom: 12 }}>{v.notes}</p>}

          {supported.length > 0 && (
            <Section title={`✓ Supported (${supported.length})`} color="#047857">
              {supported.map((c, i) => (
                <ClaimRow key={i} claim={c.claim} sub={c.source || c.vault_id} tone="good" />
              ))}
            </Section>
          )}

          {flagged.length > 0 && (
            <Section title={`✗ Flagged (${flagged.length})`} color="#B91C1C">
              {flagged.map((c, i) => (
                <ClaimRow key={i} claim={c.claim} sub={c.reason + (c.suggested_fix ? ` — fix: ${c.suggested_fix}` : '')} tone="bad" />
              ))}
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    verified:            { bg: '#D1FAE5', color: '#047857' },
    partially_verified:  { bg: '#FEF3C7', color: '#B45309' },
    unverified:          { bg: '#FEE2E2', color: '#B91C1C' },
  };
  const m = map[status] ?? map.unverified;
  return (
    <span style={{ background: m.bg, color: m.color, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {status.replace('_', ' ')}
    </span>
  );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  );
}

function ClaimRow({ claim, sub, tone }: { claim: string; sub: string; tone: 'good' | 'bad' }) {
  return (
    <div
      style={{
        fontSize: 12,
        padding: '8px 10px',
        background: tone === 'good' ? '#ECFDF5' : '#FEF2F2',
        borderLeft: `3px solid ${tone === 'good' ? '#10B981' : '#EF4444'}`,
        borderRadius: 4,
      }}
    >
      <div style={{ color: '#1E1040', marginBottom: 2 }}>{claim}</div>
      <div style={{ color: '#6B7280' }}>{sub}</div>
    </div>
  );
}

function MetaPanel({ draft }: { draft: ContentDraft }) {
  const m = draft.ai_metadata ?? {};
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, fontSize: 12, color: '#6B7280' }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E1040', marginBottom: 10 }}>Provenance</h3>
      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 10px', margin: 0 }}>
        <dt>OpenAI</dt>     <dd>{m.openai_model ?? '—'}</dd>
        <dt>Anthropic</dt>  <dd>{m.anthropic_model ?? '—'}</dd>
        <dt>Tokens</dt>     <dd>{m.tokens?.total ?? '—'}</dd>
        <dt>Vault refs</dt> <dd>{draft.vault_refs.length}</dd>
        <dt>Created</dt>    <dd>{new Date(draft.created_at).toLocaleString()}</dd>
        <dt>Updated</dt>    <dd>{new Date(draft.updated_at).toLocaleString()}</dd>
      </dl>
    </div>
  );
}
