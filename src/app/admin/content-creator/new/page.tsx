"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * /admin/content-creator/new — create a brief and kick off stage 1.
 *
 * Submitting this form calls the edge fn `generate_ideas` stage, which pulls
 * vault context, asks OpenAI for N ideas, and inserts them as `status='idea'`
 * rows. On success we redirect back to the Ideas tab where the new rows
 * appear ready for approval.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { generateIdeas } from "@/lib/content-creator/client";
import { SOCIAL_PLATFORMS, PLATFORM_CONFIG } from "@/lib/content-creator/platforms";
import type { ContentType, SocialPlatform } from "@/lib/content-creator/types";
import {
  getTopic,
  listTopics,
  type ContentTopic,
} from "@/lib/content-creator/topics";

export default function NewBriefPage() {
  // useSearchParams requires a Suspense boundary in Next 14+ static/prerender
  // paths. Wrapping the whole inner component keeps the build happy.
  return (
    <Suspense fallback={<div style={{ padding: 40, color: '#9CA3AF' }}>Loading…</div>}>
      <NewBriefPageInner />
    </Suspense>
  );
}

function NewBriefPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [contentType, setContentType] = useState<ContentType>('social');
  const [platform, setPlatform] = useState<SocialPlatform>('linkedin');
  const [topic, setTopic]       = useState("");
  const [tone, setTone]         = useState("");
  const [audience, setAudience] = useState("");
  const [keywords, setKeywords] = useState("");   // comma-separated
  const [vaultCat, setVaultCat] = useState("");
  const [count, setCount]       = useState(5);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Topic-driven state: which topic this brief was spawned from, and the
  // list of other approved topics shown in the sidebar.
  const [sourceTopic,     setSourceTopic]     = useState<ContentTopic | null>(null);
  const [approvedTopics,  setApprovedTopics]  = useState<ContentTopic[]>([]);

  /** Pre-fill every brief field from a topic. Used both by ?topic_id= deep
   *  links and by clicking a card in the sidebar. */
  const applyTopic = useCallback((t: ContentTopic) => {
    setSourceTopic(t);
    setTopic(t.title);
    if (t.suggested_tone)     setTone(t.suggested_tone);
    if (t.suggested_audience) setAudience(t.suggested_audience);
    if ((t.suggested_keywords ?? []).length > 0) setKeywords((t.suggested_keywords ?? []).join(', '));
    if (t.vault_category)     setVaultCat(t.vault_category);
  }, []);

  const clearSourceTopic = useCallback(() => setSourceTopic(null), []);

  // Deep-link prefill: /admin/content-creator/new?topic_id=…
  useEffect(() => {
    const id = searchParams.get('topic_id');
    if (!id) return;
    getTopic(id).then(applyTopic).catch((e) => {
      setError(`Could not load topic: ${e instanceof Error ? e.message : String(e)}`);
    });
  }, [searchParams, applyTopic]);

  // Sidebar: approved + draft topics (draft-approved show on the same list
  // because an admin may want to "use" a topic before the review click).
  useEffect(() => {
    listTopics({ status: 'approved', limit: 30 })
      .then(setApprovedTopics)
      .catch(() => { /* sidebar is non-critical */ });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await generateIdeas({
        content_type: contentType,
        platform: contentType === 'social' ? platform : undefined,
        brief: {
          topic: topic.trim(),
          tone:          tone.trim()    || undefined,
          audience:      audience.trim() || undefined,
          keywords:      keywords.split(',').map((s) => s.trim()).filter(Boolean),
          vault_category: vaultCat.trim() || undefined,
          // Backend flips this topic to 'used' post-success.
          source_topic_id: sourceTopic?.id,
        },
        count,
      });
      if (result.length === 0) {
        setError("No ideas returned. Try a broader topic or remove the vault category filter.");
        setSubmitting(false);
        return;
      }
      router.push('/admin/content-creator');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Link href="/admin/content-creator" style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none' }}>
              ← Back to Content Creator
            </Link>
          </div>
          <h1 className="swa-page-title">New Brief</h1>
          <p className="swa-page-subtitle">
            Fill in the brief. We’ll generate {count} ideas using the Vault as the source of truth, then you approve the ones worth turning into full content.
          </p>
        </div>
      </div>

      {error && <div className="swa-alert swa-alert--error" style={{ marginBottom: 20 }}>{error}</div>}

      {sourceTopic && (
        <div style={{
          background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10,
          padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span className="material-symbols-outlined" style={{ color: '#4338CA' }}>lightbulb</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#4338CA', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Pre-filled from topic
            </div>
            <div style={{ fontSize: 14, color: '#1E1040', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {sourceTopic.title}
            </div>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
              Generating ideas will retire this topic (one-shot).
            </div>
          </div>
          <button type="button" onClick={clearSourceTopic} className="swa-icon-btn" title="Unlink topic">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: approvedTopics.length > 0 ? '1fr 280px' : '1fr', gap: 24, alignItems: 'flex-start' }}>
      <form
        onSubmit={onSubmit}
        style={{
          background: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {/* Content type + platform */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Content type" required>
            <select value={contentType} onChange={(e) => setContentType(e.target.value as ContentType)} style={inputStyle}>
              <option value="social">Social post</option>
              <option value="blog">Blog post</option>
              <option value="newsletter">Newsletter</option>
            </select>
          </Field>
          {contentType === 'social' && (
            <Field label="Platform" required>
              <select value={platform} onChange={(e) => setPlatform(e.target.value as SocialPlatform)} style={inputStyle}>
                {SOCIAL_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {PLATFORM_CONFIG[p].label} · {PLATFORM_CONFIG[p].maxChars}ch
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>

        {/* Topic */}
        <Field label="Topic" required hint="One sentence describing what this content should be about.">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Why check-ins catch student mental-health issues early"
            style={inputStyle}
            required
            minLength={3}
            maxLength={500}
          />
        </Field>

        {/* Tone + audience */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Tone (optional)">
            <input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="evidence-based, warm, direct…" style={inputStyle} />
          </Field>
          <Field label="Audience (optional)">
            <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="school principals, parents…" style={inputStyle} />
          </Field>
        </div>

        {/* Keywords + category */}
        <Field label="Keywords (optional)" hint="Comma-separated. Used for vault keyword matching and in the prompt.">
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="wellbeing, early intervention, secondary school"
            style={inputStyle}
          />
        </Field>
        <Field label="Vault category (optional)" hint="Narrows the vault RAG to a single category. Leave blank to search everything.">
          <input value={vaultCat} onChange={(e) => setVaultCat(e.target.value)} placeholder="mental-health / statistics / research" style={inputStyle} />
        </Field>

        {/* Count */}
        <Field label="How many ideas?">
          <input
            type="number"
            min={1}
            max={10}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(10, parseInt(e.target.value || '5', 10))))}
            style={{ ...inputStyle, maxWidth: 120 }}
          />
        </Field>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
          <Link href="/admin/content-creator" className="swa-btn">Cancel</Link>
          <button type="submit" className="swa-btn swa-btn--primary" disabled={submitting}>
            {submitting ? 'Generating ideas…' : 'Generate ideas'}
          </button>
        </div>
      </form>

      {approvedTopics.length > 0 && (
        <aside>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: '#1E1040', textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>
              Approved topics
            </h3>
            <Link href="/admin/content-creator/topics" style={{ fontSize: 11, color: '#6B7280', textDecoration: 'none' }}>
              All →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {approvedTopics.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTopic(t)}
                style={{
                  textAlign: 'left', background: '#fff', border: `1px solid ${sourceTopic?.id === t.id ? '#4338CA' : '#E5E7EB'}`,
                  borderRadius: 10, padding: 10, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1E1040', lineHeight: 1.3, marginBottom: 4 }}>
                  {t.title}
                </div>
                {t.vault_category && (
                  <span style={{ fontSize: 10, padding: '1px 6px', background: '#EEF2FF', color: '#4338CA', borderRadius: 3, fontWeight: 600 }}>
                    {t.vault_category}
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>
      )}
    </div>
    </div>
  );
}

/* ─── Tiny presentational helpers ────────────────────────────────────────── */

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  fontSize: 14,
  fontFamily: 'inherit',
  background: '#fff',
};

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}{required ? ' *' : ''}
      </span>
      {children}
      {hint && <span style={{ fontSize: 12, color: '#9CA3AF' }}>{hint}</span>}
    </label>
  );
}
