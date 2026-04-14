"use client";
import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const INPUT = "w-full rounded-xl px-4 py-2.5 text-[15px] outline-none transition-all";
const IS: React.CSSProperties = { background: "#fff", border: "1px solid var(--admin-border-strong)", color: "var(--admin-text-primary)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" };
const LABEL = "block text-xs font-semibold mb-2 uppercase tracking-wide";
const LS: React.CSSProperties = { color: "var(--admin-text-subtle)" };
const FIELD = "mb-5";

interface SeoPanelProps {
  seoTitle: string;
  seoDesc: string;
  ogImage: string;
  defaultTitle?: string;
  defaultDesc?: string;
  onChange: (field: "seo_title" | "seo_desc" | "og_image", value: string) => void;
  recordId?: string;
  recordType?: 'issue' | 'state' | 'area';
}

export default function SeoPanel({ seoTitle, seoDesc, ogImage, defaultTitle = "", defaultDesc = "", onChange, recordId, recordType }: SeoPanelProps) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  
  const titleLen = seoTitle.length;
  const descLen = seoDesc.length;
  const titleScore = titleLen === 0 ? "default" : titleLen < 30 ? "short" : titleLen > 60 ? "long" : "good";
  const descScore = descLen === 0 ? "default" : descLen < 70 ? "short" : descLen > 160 ? "long" : "good";

  const scoreColor = (s: string) => s === "good" ? "var(--admin-success-light)" : s === "default" ? "var(--admin-text-faint)" : "var(--admin-warning-light)";
  const scoreLabel = (s: string, len: number) => s === "default" ? "using page default" : `${len} chars — ${s}`;

  const handleGenerate = async () => {
    if (!recordId || !recordType) {
      setError("Cannot generate: missing record information");
      return;
    }

    setGenerating(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError("Not authenticated");
        return;
      }

      const TABLE_MAP: Record<NonNullable<typeof recordType>, string> = {
        issue: 'issues',
        state: 'states',
        area:  'areas',
      };

      const response = await fetch('/api/admin/seo-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          table: TABLE_MAP[recordType],
          ids: [recordId],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate SEO' }));
        throw new Error(errorData.error || 'Failed to generate SEO');
      }

      const data = await response.json();
      const result = data.results?.[0];
      if (result?.seo_title) {
        onChange('seo_title', result.seo_title);
      }
      if (result?.seo_desc) {
        onChange('seo_desc', result.seo_desc);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate SEO');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="admin-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--admin-accent-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <h2 className="text-sm font-semibold" style={{ color: "var(--admin-text-primary)" }}>SEO &amp; Social</h2>
        </div>
        {recordId && recordType && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="admin-btn admin-btn-secondary admin-btn-sm"
            style={{ opacity: generating ? 0.6 : 1, gap: 6 }}
          >
            {generating ? (
              <>
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                  <path d="M12 2a10 10 0 0 1 10 10"/>
                </svg>
                Generating…
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Generate SEO
              </>
            )}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="admin-alert admin-alert-error mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Live Google preview */}
      <div className="rounded-xl p-5 mb-6" style={{ background: "var(--admin-bg-elevated)", border: "1px solid var(--admin-border)", opacity: generating ? 0.5 : 1, transition: "opacity 0.2s" }}>
        <div className="text-xs mb-2 font-semibold uppercase tracking-wide" style={{ color: "var(--admin-text-faint)" }}>Google Preview</div>
        <div className="text-xs mb-0.5" style={{ color: "var(--admin-text-subtle)" }}>nationalcheckinweek.com › ...</div>
        <div className="text-sm font-medium mb-0.5 truncate" style={{ color: "var(--admin-accent-light)" }}>
          {seoTitle || defaultTitle || "Page Title"}
        </div>
        <div className="text-xs line-clamp-2" style={{ color: "var(--admin-text-muted)" }}>
          {seoDesc || defaultDesc || "Page description will appear here…"}
        </div>
      </div>

      {/* SEO Title */}
      <div className={FIELD}>
        <div className="flex items-center justify-between mb-1.5">
          <label className={LABEL} style={LS}>SEO Title</label>
          <span className="text-xs" style={{ color: scoreColor(titleScore) }}>{scoreLabel(titleScore, titleLen)}</span>
        </div>
        <input
          className={INPUT} style={IS}
          value={seoTitle}
          onChange={e => onChange("seo_title", e.target.value)}
          placeholder={defaultTitle || "Defaults to page title"}
          maxLength={80}
        />
        {/* Character bar */}
        <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "var(--admin-bg-elevated)" }}>
          <div className="h-full rounded-full transition-all" style={{
            width: `${Math.min((titleLen / 60) * 100, 100)}%`,
            background: scoreColor(titleScore),
          }} />
        </div>
        <div className="flex justify-between text-xs mt-1" style={{ color: "var(--admin-text-faint)" }}>
          <span>0</span><span style={{ color: "var(--admin-text-subtle)" }}>ideal: 30–60</span><span>60</span>
        </div>
      </div>

      {/* SEO Description */}
      <div className={FIELD}>
        <div className="flex items-center justify-between mb-1.5">
          <label className={LABEL} style={LS}>Meta Description</label>
          <span className="text-xs" style={{ color: scoreColor(descScore) }}>{scoreLabel(descScore, descLen)}</span>
        </div>
        <textarea
          rows={3}
          className={INPUT} style={{ ...IS, resize: "none" }}
          value={seoDesc}
          onChange={e => onChange("seo_desc", e.target.value)}
          placeholder={defaultDesc || "A compelling 70–160 character summary of this page"}
          maxLength={200}
        />
        <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "var(--admin-bg-elevated)" }}>
          <div className="h-full rounded-full transition-all" style={{
            width: `${Math.min((descLen / 160) * 100, 100)}%`,
            background: scoreColor(descScore),
          }} />
        </div>
        <div className="flex justify-between text-xs mt-1" style={{ color: "var(--admin-text-faint)" }}>
          <span>0</span><span style={{ color: "var(--admin-text-subtle)" }}>ideal: 70–160</span><span>160</span>
        </div>
      </div>

      {/* OG Image */}
      <div>
        <label className={LABEL} style={LS}>
          OG / Social Image URL
          <span className="ml-2 normal-case font-normal tracking-normal" style={{ color: "var(--admin-text-faint)" }}>
            (shown when shared on Facebook, Twitter, LinkedIn)
          </span>
        </label>
        <input
          className={INPUT} style={IS}
          value={ogImage}
          onChange={e => onChange("og_image", e.target.value)}
          placeholder="https://yourcdn.com/image.jpg (1200×630px recommended)"
        />
        {ogImage && (
          <div className="mt-2 rounded-lg overflow-hidden" style={{ border: "1px solid var(--admin-border)", maxWidth: "240px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ogImage} alt="OG preview" className="w-full object-cover" style={{ maxHeight: "126px" }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--admin-border)" }}>
        <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--admin-text-faint)" }}>Tips</div>
        <ul className="text-xs space-y-1" style={{ color: "var(--admin-text-faint)" }}>
          <li>• Leave blank to use the page title/description as defaults</li>
          <li>• Include the primary keyword near the start of the SEO title</li>
          <li>• Meta description doesn't affect ranking — but affects click-through rate</li>
          <li>• OG image should be 1200×630px for best results across platforms</li>
        </ul>
      </div>
    </div>
  );
}
