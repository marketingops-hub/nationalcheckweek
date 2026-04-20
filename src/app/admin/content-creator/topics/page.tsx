"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * /admin/content-creator/topics
 *
 * Pre-stage-0 idea bank. Admin hits "Generate topics from vault" → picks a
 * category (+ optional seed) → gets 3-10 topic cards. Each card can be
 * approved, archived, or taken straight into the brief form.
 *
 * One-shot semantics: once a topic spawns a draft the backend flips it to
 * 'used'. Used topics stay visible in the "Used" tab for audit.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  listTopics,
  generateTopics,
  approveTopic,
  archiveTopic,
  deleteTopic,
  type ContentTopic,
  type TopicStatus,
} from "@/lib/content-creator/topics";

const TABS: { key: TopicStatus | 'all'; label: string }[] = [
  { key: 'draft',    label: 'To review' },
  { key: 'approved', label: 'Approved' },
  { key: 'used',     label: 'Used' },
  { key: 'archived', label: 'Archived' },
];

export default function TopicsPage() {
  const [tab,     setTab]     = useState<TopicStatus | 'all'>('draft');
  const [topics,  setTopics]  = useState<ContentTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [showGen, setShowGen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listTopics({ status: tab, limit: 200 });
      setTopics(data);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { refresh(); }, [refresh]);

  const counts = useMemo(() => {
    const m: Record<TopicStatus, number> = { draft: 0, approved: 0, used: 0, archived: 0 };
    for (const t of topics) m[t.status] += 1;
    return m;
  }, [topics]);

  async function onApprove(t: ContentTopic) {
    try {
      const updated = await approveTopic(t.id);
      // If the current tab no longer includes this status, drop the row.
      setTopics((rows) => rows.map((r) => (r.id === t.id ? updated : r))
        .filter((r) => tab === 'all' || r.status === tab));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }

  async function onArchive(t: ContentTopic) {
    try {
      const updated = await archiveTopic(t.id);
      setTopics((rows) => rows.map((r) => (r.id === t.id ? updated : r))
        .filter((r) => tab === 'all' || r.status === tab));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }

  async function onDelete(t: ContentTopic) {
    if (!confirm(`Delete "${t.title}" permanently? Use Archive to keep the audit trail.`)) return;
    try {
      await deleteTopic(t.id);
      setTopics((rows) => rows.filter((r) => r.id !== t.id));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }

  async function onGenerated(newTopics: ContentTopic[]) {
    setShowGen(false);
    setTab('draft');
    setTopics((old) => [...newTopics, ...old.filter((t) => !newTopics.find((n) => n.id === t.id))]);
  }

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Link href="/admin/content-creator" style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none' }}>
              ← Content Creator
            </Link>
          </div>
          <h1 className="swa-page-title">Topics</h1>
          <p className="swa-page-subtitle">
            Content angles proposed by the AI from your Vault. Approve the good ones — they&apos;ll
            show up as shortcuts in the brief form. Using a topic creates a draft; the topic
            is then retired (one-shot).
          </p>
        </div>
        <button onClick={() => setShowGen(true)} className="swa-btn swa-btn--primary">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>auto_awesome</span>
          Generate topics from vault
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #E5E7EB', marginBottom: 20 }}>
        {TABS.map((t) => {
          const count = t.key === 'all' ? topics.length : counts[t.key as TopicStatus];
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '10px 16px',
                border: 'none',
                borderBottom: active ? '2px solid #1E1040' : '2px solid transparent',
                background: 'transparent',
                color: active ? '#1E1040' : '#6B7280',
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              {t.label} {count > 0 && <span style={{ opacity: 0.6, marginLeft: 4 }}>({count})</span>}
            </button>
          );
        })}
      </div>

      {error && <div className="swa-alert swa-alert--error" style={{ marginBottom: 20 }}>{error}</div>}

      {loading && topics.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>Loading…</div>
      ) : topics.length === 0 ? (
        <EmptyState tab={tab} onGenerate={() => setShowGen(true)} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {topics.map((t) => (
            <TopicCard
              key={t.id}
              topic={t}
              onApprove={() => onApprove(t)}
              onArchive={() => onArchive(t)}
              onDelete={() => onDelete(t)}
            />
          ))}
        </div>
      )}

      {showGen && <GenerateModal onClose={() => setShowGen(false)} onGenerated={onGenerated} />}
    </div>
  );
}

/* ─── Topic card ──────────────────────────────────────────────────────── */

function TopicCard({
  topic, onApprove, onArchive, onDelete,
}: {
  topic: ContentTopic;
  onApprove: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const usable = topic.status === 'approved' || topic.status === 'draft';
  return (
    <div style={{
      background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
      padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <h3 style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#1E1040', margin: 0, lineHeight: 1.3 }}>
          {topic.title}
        </h3>
        <StatusChip status={topic.status} />
      </div>

      <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.5 }}>{topic.angle}</p>

      {topic.rationale && (
        <p style={{ fontSize: 12, color: '#6B7280', margin: 0, fontStyle: 'italic', lineHeight: 1.4 }}>
          {topic.rationale}
        </p>
      )}

      {(topic.suggested_keywords ?? []).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {(topic.suggested_keywords ?? []).slice(0, 6).map((k) => (
            <span key={k} style={{ fontSize: 11, padding: '2px 8px', background: '#F3F4F6', borderRadius: 4, color: '#374151' }}>
              {k}
            </span>
          ))}
        </div>
      )}

      <div style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {topic.vault_category && (
          <span style={{ background: '#EEF2FF', color: '#4338CA', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
            {topic.vault_category}
          </span>
        )}
        <span>{(topic.source_document_ids ?? []).length} source{(topic.source_document_ids ?? []).length === 1 ? '' : 's'}</span>
        {topic.suggested_audience && <span>· {topic.suggested_audience}</span>}
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
        {topic.status === 'draft' && (
          <button onClick={onApprove} className="swa-btn swa-btn--primary" style={{ fontSize: 12, padding: '6px 12px' }}>
            Approve
          </button>
        )}
        {usable && (
          <Link
            href={`/admin/content-creator/new?topic_id=${topic.id}`}
            className="swa-btn"
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
            Use →
          </Link>
        )}
        {topic.status === 'used' && topic.used_in_draft_id && (
          <Link
            href={`/admin/content-creator/${topic.used_in_draft_id}`}
            className="swa-btn"
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            View draft
          </Link>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {topic.status !== 'archived' && topic.status !== 'used' && (
            <button onClick={onArchive} className="swa-icon-btn" title="Archive">
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#6B7280' }}>archive</span>
            </button>
          )}
          <button onClick={onDelete} className="swa-icon-btn" title="Delete permanently">
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#EF4444' }}>delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: TopicStatus }) {
  const m: Record<TopicStatus, { bg: string; color: string; label: string }> = {
    draft:    { bg: '#FEF3C7', color: '#92400E', label: 'To review' },
    approved: { bg: '#D1FAE5', color: '#047857', label: 'Approved'  },
    used:     { bg: '#E0E7FF', color: '#4338CA', label: 'Used'      },
    archived: { bg: '#F3F4F6', color: '#6B7280', label: 'Archived'  },
  };
  const t = m[status];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: t.bg, color: t.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {t.label}
    </span>
  );
}

/* ─── Empty state ─────────────────────────────────────────────────────── */

function EmptyState({ tab, onGenerate }: { tab: TopicStatus | 'all'; onGenerate: () => void }) {
  const msg =
    tab === 'draft'    ? "No topics awaiting review. Generate some from the Vault to get started." :
    tab === 'approved' ? "No approved topics yet. Approve some from the 'To review' tab." :
    tab === 'used'     ? "No used topics yet. Topics move here after they spawn a draft." :
    tab === 'archived' ? "Nothing archived." :
                         "No topics yet.";
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px', color: '#9CA3AF', border: '1px dashed #E5E7EB', borderRadius: 12 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 16, color: '#D1D5DB' }}>lightbulb</span>
      <p style={{ marginBottom: 20 }}>{msg}</p>
      {(tab === 'draft' || tab === 'all') && (
        <button onClick={onGenerate} className="swa-btn swa-btn--primary">
          Generate topics from vault
        </button>
      )}
    </div>
  );
}

/* ─── Generate modal ──────────────────────────────────────────────────── */

function GenerateModal({
  onClose, onGenerated,
}: { onClose: () => void; onGenerated: (topics: ContentTopic[]) => void }) {
  const [category, setCategory] = useState('general');
  const [count,    setCount]    = useState(5);
  const [seed,     setSeed]     = useState('');
  const [busy,     setBusy]     = useState(false);
  const [err,      setErr]      = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const topics = await generateTopics({
        vault_category: category.trim() || 'all',
        count,
        seed: seed.trim() || undefined,
      });
      onGenerated(topics);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(17, 24, 39, 0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20,
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        style={{
          background: '#fff', borderRadius: 12, padding: 24, maxWidth: 520, width: '100%',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1E1040' }}>Generate topics from vault</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
            The AI will read your vault documents (filtered by category) and propose content angles.
          </p>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Category *
          </span>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            placeholder="general, research, loneliness, events… or 'all'"
            style={{ padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14 }}
          />
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>
            Must match a Vault document category, or use <code>all</code> for cross-category.
          </span>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            How many topics
          </span>
          <input
            type="number" min={1} max={10} value={count}
            onChange={(e) => setCount(parseInt(e.target.value, 10) || 5)}
            style={{ padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, width: 120 }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Seed (optional)
          </span>
          <input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="e.g. angles for hospitality workers, or Gen Z loneliness"
            style={{ padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14 }}
          />
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>
            Leave blank for a diverse sample of the whole category.
          </span>
        </label>

        {err && <div className="swa-alert swa-alert--error">{err}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="swa-btn" disabled={busy}>Cancel</button>
          <button type="submit" className="swa-btn swa-btn--primary" disabled={busy}>
            {busy ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </form>
    </div>
  );
}
