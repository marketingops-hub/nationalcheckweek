"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * /admin/content-creator — pipeline overview.
 *
 * Previously this page hosted tabs for every stage (ideas / drafts /
 * verified / archived). That made it a giant component that could crash
 * any stage's rendering if one bad row landed on the list. We split each
 * stage into its own URL and left this page as a lightweight dashboard:
 *
 *   - KPI cards showing row counts per stage
 *   - Links into each stage page
 *   - "Recent activity" strip with the 5 most recently touched drafts
 *
 * All heavy rendering now lives under /ideas, /drafts, /verified,
 * /archived — each of which is protected by the shared error.tsx boundary
 * at this folder level.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import Link from "next/link";
import { listDrafts, getStats } from "@/lib/content-creator/client";
import type { ContentDraft, ContentStatus } from "@/lib/content-creator/types";

type StageSummary = {
  key: 'ideas' | 'drafts' | 'verified' | 'archived';
  label: string;
  href: string;
  icon: string;
  statuses: ContentStatus[];
  count: number;
  hint: string;
};

export default function ContentCreatorOverview() {
  const [stages, setStages] = useState<StageSummary[]>([
    { key: 'ideas',    label: 'Ideas',    href: '/admin/content-creator/ideas',    icon: 'lightbulb',   statuses: ['idea', 'approved_idea', 'generating'], count: 0, hint: 'Stage 1. Approve to generate content.' },
    { key: 'drafts',   label: 'Drafts',   href: '/admin/content-creator/drafts',   icon: 'edit_note',   statuses: ['draft', 'verifying', 'rejected'],      count: 0, hint: 'Stage 2. Edit and verify against vault.' },
    { key: 'verified', label: 'Verified', href: '/admin/content-creator/verified', icon: 'verified',    statuses: ['verified'],                            count: 0, hint: 'Stage 3. Ready for team use.' },
    { key: 'archived', label: 'Archived', href: '/admin/content-creator/archived', icon: 'inventory_2', statuses: ['archived'],                            count: 0, hint: 'Soft-deleted. Kept for audit.' },
  ]);
  const [recent,  setRecent]  = useState<ContentDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // Two calls in parallel:
        //   1. getStats      → exact per-status counts (PostgREST HEAD)
        //   2. listDrafts    → the 20 most-recently-updated rows for the
        //                       "recent activity" strip. We then take 5.
        const [counts, recentRows] = await Promise.all([
          getStats(),
          listDrafts({ limit: 20 }),
        ]);
        if (cancelled) return;
        setStages((prev) =>
          prev.map((s) => ({
            ...s,
            count: s.statuses.reduce((sum, st) => sum + (counts[st] ?? 0), 0),
          })),
        );
        setRecent(recentRows.slice(0, 5));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Content Creator</h1>
          <p className="swa-page-subtitle">
            Vault-grounded pipeline: topic → idea → draft → verified. Every stage has its own page so you can focus on one thing at a time.
          </p>
        </div>
        <Link href="/admin/content-creator/new" className="swa-btn swa-btn--primary">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          New Brief
        </Link>
      </div>

      {error && <div className="swa-alert swa-alert--error" style={{ marginBottom: 20 }}>{error}</div>}

      {/* Pipeline shortcut */}
      <div style={{
        display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24,
        padding: 16, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12,
      }}>
        <PipelineStep icon="lightbulb"   label="Topics"    href="/admin/content-creator/topics"   color="#4338CA" />
        <PipelineArrow />
        <PipelineStep icon="lightbulb"   label="Ideas"     href="/admin/content-creator/ideas"    color="#B45309" />
        <PipelineArrow />
        <PipelineStep icon="edit_note"   label="Drafts"    href="/admin/content-creator/drafts"   color="#374151" />
        <PipelineArrow />
        <PipelineStep icon="verified"    label="Verified"  href="/admin/content-creator/verified" color="#047857" />
      </div>

      {/* Stage KPI cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12, marginBottom: 24,
      }}>
        {stages.map((s) => (
          <Link
            key={s.key}
            href={s.href}
            style={{
              display: 'block', background: '#fff', border: '1px solid #E5E7EB',
              borderRadius: 12, padding: 16, textDecoration: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6B7280', marginBottom: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{s.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {s.label}
              </span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#1E1040', lineHeight: 1 }}>
              {loading ? '…' : s.count}
            </div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>{s.hint}</div>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1040', margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Recent activity
          </h2>
          <Link href="/admin/content-creator/ideas" style={{ fontSize: 12, color: '#6B7280', textDecoration: 'none' }}>
            See all →
          </Link>
        </div>
        {loading ? (
          <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>Loading…</p>
        ) : recent.length === 0 ? (
          <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>
            No drafts yet. <Link href="/admin/content-creator/new">Start a brief</Link> or{' '}
            <Link href="/admin/content-creator/topics">generate topics from the vault</Link>.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recent.map((d) => <RecentRow key={d.id} draft={d} />)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Subcomponents ─────────────────────────────────────────────────────── */

function PipelineStep({ icon, label, href, color }: { icon: string; label: string; href: string; color: string }) {
  return (
    <Link href={href} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '8px 12px', background: '#fff', border: '1px solid #E5E7EB',
      borderRadius: 8, textDecoration: 'none', color,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
    </Link>
  );
}

function PipelineArrow() {
  return (
    <span className="material-symbols-outlined" style={{ color: '#D1D5DB', fontSize: 18 }}>
      arrow_forward
    </span>
  );
}

function RecentRow({ draft }: { draft: ContentDraft }) {
  const body = typeof draft.body === 'string' ? draft.body : '';
  const title = (draft.title ?? (body.slice(0, 60) + (body.length > 60 ? '…' : ''))) || '(untitled)';
  return (
    <Link
      href={`/admin/content-creator/${draft.id}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
        borderRadius: 8, textDecoration: 'none', color: 'inherit',
        border: '1px solid transparent',
      }}
    >
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
        background: '#F3F4F6', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5,
      }}>
        {draft.status.replace('_', ' ')}
      </span>
      <span style={{
        flex: 1, minWidth: 0, fontSize: 13, color: '#1E1040',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {title}
      </span>
      <span style={{ fontSize: 11, color: '#9CA3AF' }}>
        {new Date(draft.updated_at).toLocaleString()}
      </span>
    </Link>
  );
}
