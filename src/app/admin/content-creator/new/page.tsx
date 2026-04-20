"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * /admin/content-creator/new — create a brief and kick off stage 1.
 *
 * Submitting this form calls the edge fn `generate_ideas` stage, which pulls
 * vault context, asks OpenAI for N ideas, and inserts them as `status='idea'`
 * rows. On success we redirect back to the Ideas tab where the new rows
 * appear ready for approval.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateIdeas } from "@/lib/content-creator/client";
import { SOCIAL_PLATFORMS, PLATFORM_CONFIG } from "@/lib/content-creator/platforms";
import type { ContentType, SocialPlatform } from "@/lib/content-creator/types";

export default function NewBriefPage() {
  const router = useRouter();

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

      <form
        onSubmit={onSubmit}
        style={{
          background: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          padding: 24,
          maxWidth: 760,
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
