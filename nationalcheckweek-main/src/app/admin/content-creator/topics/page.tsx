"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * /admin/content-creator/topics — pre-stage-0 idea bank.
 *
 * Thin orchestrator after the Apr 2026 refactor. UI pieces live in:
 *   _components/TopicsTabs.tsx           — status tab strip
 *   _components/TopicCard.tsx            — single tile
 *   _components/TopicsEmptyState.tsx     — empty-list message + CTA
 *   _components/GenerateTopicsModal.tsx  — Generate dialog
 *
 * One-shot semantics: once a topic spawns a draft the backend flips it to
 * 'used'. Used topics stay visible in the "Used" tab for audit.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  listTopics, approveTopic, archiveTopic, deleteTopic,
  type ContentTopic, type TopicStatus,
} from "@/lib/content-creator/topics";
import { TopicsTabs, type TabKey }  from "./_components/TopicsTabs";
import { TopicCard }                from "./_components/TopicCard";
import { TopicsEmptyState }         from "./_components/TopicsEmptyState";
import { GenerateTopicsModal }      from "./_components/GenerateTopicsModal";

export default function TopicsPage() {
  const [tab,     setTab]     = useState<TabKey>('draft');
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

  // Counts feed the tab labels. Derived from whatever is currently loaded,
  // which is fine because we fetch the whole tab (limit=200) on every switch.
  const counts = useMemo(() => {
    const m: Record<TopicStatus, number> = { draft: 0, approved: 0, used: 0, archived: 0 };
    for (const t of topics) m[t.status] += 1;
    return m;
  }, [topics]);

  /**
   * After a status transition, drop the row from the visible list if the
   * current tab would no longer include it. The 'all' tab (unused today
   * but wired in TopicsTabs) keeps every row.
   */
  const updateAndMaybeDrop = useCallback(
    (id: string, updated: ContentTopic) => {
      setTopics((rows) => rows
        .map((r) => (r.id === id ? updated : r))
        .filter((r) => tab === 'all' || r.status === tab),
      );
    },
    [tab],
  );

  async function onApprove(t: ContentTopic) {
    try {
      const updated = await approveTopic(t.id);
      updateAndMaybeDrop(t.id, updated);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }

  async function onArchive(t: ContentTopic) {
    try {
      const updated = await archiveTopic(t.id);
      updateAndMaybeDrop(t.id, updated);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }

  async function onDelete(t: ContentTopic) {
    if (!confirm(`Delete "${t.title}" permanently? Use Archive to keep the audit trail.`)) return;
    try {
      await deleteTopic(t.id);
      setTopics((rows) => rows.filter((r) => r.id !== t.id));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }

  function onGenerated(newTopics: ContentTopic[]) {
    setShowGen(false);
    setTab('draft');
    // Prepend the fresh batch; dedup by id in case the backend merged
    // near-duplicates with existing draft rows.
    setTopics((old) => [
      ...newTopics,
      ...old.filter((t) => !newTopics.find((n) => n.id === t.id)),
    ]);
  }

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Link
              href="/admin/content-creator"
              style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none' }}
            >
              ← Content Creator
            </Link>
          </div>
          <h1 className="swa-page-title">Topics</h1>
          <p className="swa-page-subtitle">
            Content angles proposed by the AI from your Vault. Approve the good
            ones — they&apos;ll show up as shortcuts in the brief form. Using a
            topic creates a draft; the topic is then retired (one-shot).
          </p>
        </div>
        <button onClick={() => setShowGen(true)} className="swa-btn swa-btn--primary">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>auto_awesome</span>
          Generate topics from vault
        </button>
      </div>

      <TopicsTabs
        active={tab}
        counts={counts}
        totalCount={topics.length}
        onChange={setTab}
      />

      {error && <div className="swa-alert swa-alert--error" style={{ marginBottom: 20 }}>{error}</div>}

      {loading && topics.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>Loading…</div>
      ) : topics.length === 0 ? (
        <TopicsEmptyState tab={tab} onGenerate={() => setShowGen(true)} />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 14,
        }}>
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

      {showGen && (
        <GenerateTopicsModal
          onClose={() => setShowGen(false)}
          onGenerated={onGenerated}
        />
      )}
    </div>
  );
}
