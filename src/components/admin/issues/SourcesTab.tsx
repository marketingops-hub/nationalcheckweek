"use client";

import React from "react";
import { type NewSourceState, INPUT_CLS, INPUT_STYLE, LABEL_CLS, LABEL_STYLE } from "./IssueTypes";
import type { IssueSource } from "@/components/admin/ui";
import { checkUrlSpecificity } from "@/lib/sources/validation";

/**
 * Form field wrapper with label
 * 
 * @param label - Field label text
 * @param children - Field input element
 */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-4"><label className={LABEL_CLS} style={LABEL_STYLE}>{label}</label>{children}</div>;
}

/**
 * Display URL specificity warning if URL is too generic
 * 
 * Shows a yellow warning box if the URL points to a homepage, section page,
 * or is otherwise too generic. Returns null if URL is specific enough.
 * 
 * @param url - The URL to validate for specificity
 * @returns Warning message in alert box, or null if URL is specific
 * 
 * @example
 * ```tsx
 * <UrlSpecificityWarning url="https://example.com" />
 * // Renders: Yellow warning box
 * 
 * <UrlSpecificityWarning url="https://example.com/reports/2024#data" />
 * // Renders: null (no warning)
 * ```
 */
function UrlSpecificityWarning({ url }: { url: string }) {
  if (!url) return null;
  
  const warning = checkUrlSpecificity(url);
  if (!warning) return null;
  
  return (
    <div className="text-[11px] mt-1.5 px-2 py-1.5 rounded bg-yellow-50 text-yellow-900 border border-yellow-200">
      {warning}
    </div>
  );
}

/**
 * Sources management tab for issue pages
 * 
 * Allows adding, viewing, and deleting sources for an issue.
 * Includes real-time URL validation and specificity warnings.
 * 
 * @param props - Component props
 * @param props.isNew - Whether this is a new issue (not yet saved)
 * @param props.dbSources - Sources from database (structured format)
 * @param props.sources - Legacy sources (old JSONB format)
 * @param props.addingSource - Whether the add source form is visible
 * @param props.newSource - New source form state
 * @param props.onSetAddingSource - Toggle add source form visibility
 * @param props.onSetNewSource - Update new source form state
 * @param props.onAddSource - Handler for adding a source
 * @param props.onDeleteSource - Handler for deleting a source
 */
export default function SourcesTab({ isNew, dbSources, sources, addingSource, newSource, onSetAddingSource, onSetNewSource, onAddSource, onDeleteSource }: {
  isNew: boolean;
  dbSources: IssueSource[];
  sources: string[];
  addingSource: boolean;
  newSource: NewSourceState;
  onSetAddingSource: (v: boolean) => void;
  onSetNewSource: (fn: (s: NewSourceState) => NewSourceState) => void;
  onAddSource: () => void;
  onDeleteSource: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="admin-card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--admin-text-primary)" }}>References &amp; Citations</h2>
            <p className="text-xs mt-1" style={{ color: "var(--admin-text-subtle)" }}>
              Authoritative sources backing the data on this page. Use <strong>Verify</strong> in the Content tab to auto-discover sources.
            </p>
          </div>
          {!isNew && (
            <button onClick={() => onSetAddingSource(true)} className="admin-btn admin-btn-primary text-xs">+ Add Source</button>
          )}
        </div>

        {addingSource && (
          <div className="rounded-xl p-4 mb-4" style={{ background: "var(--admin-bg-elevated)", border: "1px solid var(--admin-border)" }}>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="Title *">
                <input className={INPUT_CLS} style={INPUT_STYLE} value={newSource.title} onChange={e => onSetNewSource(s => ({ ...s, title: e.target.value }))} placeholder="e.g. AIHW Mental Health Report 2024" />
              </Field>
              <Field label="URL">
                <input 
                  className={INPUT_CLS} 
                  style={INPUT_STYLE} 
                  value={newSource.url} 
                  onChange={e => onSetNewSource(s => ({ ...s, url: e.target.value }))} 
                  placeholder="https://www.aihw.gov.au/reports/mental-health/youth-2024#key-findings" 
                />
                <UrlSpecificityWarning url={newSource.url} />
                <p className="text-[10px] mt-1" style={{ color: "var(--admin-text-subtle)" }}>
                  💡 Tip: Use the <strong>exact URL</strong> where the data was found, not just the homepage. Include #anchors or specific report pages.
                </p>
              </Field>
              <Field label="Publisher">
                <input className={INPUT_CLS} style={INPUT_STYLE} value={newSource.publisher} onChange={e => onSetNewSource(s => ({ ...s, publisher: e.target.value }))} placeholder="e.g. Australian Institute of Health and Welfare" />
              </Field>
              <Field label="Year">
                <input className={INPUT_CLS} style={INPUT_STYLE} value={newSource.year} onChange={e => onSetNewSource(s => ({ ...s, year: e.target.value }))} placeholder="e.g. 2024" />
              </Field>
            </div>
            <div className="flex gap-2">
              <button onClick={onAddSource} className="admin-btn admin-btn-primary admin-btn-sm">Add</button>
              <button onClick={() => { onSetAddingSource(false); onSetNewSource(() => ({ title: "", url: "", publisher: "", year: "" })); }} className="admin-btn admin-btn-secondary admin-btn-sm">Cancel</button>
            </div>
          </div>
        )}

        {dbSources.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ border: "2px dashed var(--admin-border)" }}>
            <p className="text-xs" style={{ color: "var(--admin-text-faint)" }}>
              No sources yet. Use the <strong>Verify</strong> button in the Content tab to auto-discover sources, or add them manually.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {dbSources.sort((a, b) => a.num - b.num).map(src => (
              <div key={src.id} className="flex items-start gap-3 rounded-xl p-3" style={{ background: "var(--admin-bg-elevated)", border: "1px solid var(--admin-border)" }}>
                <span className="text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ width: 28, height: 28, background: src.verified ? "#DCFCE7" : "var(--admin-border)", color: src.verified ? "#166534" : "var(--admin-text-subtle)" }}>
                  {src.num}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: "var(--admin-text-primary)" }}>
                    {src.title}
                    {src.verified && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: "#DCFCE7", color: "#166534" }}>VERIFIED</span>}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--admin-text-subtle)" }}>
                    {src.publisher}{src.publisher && src.year && " · "}{src.year}
                  </div>
                  {src.url && (
                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-xs mt-0.5 block truncate" style={{ color: "var(--admin-accent)" }}>
                      {src.url}
                    </a>
                  )}
                </div>
                <button onClick={() => onDeleteSource(src.id)} className="admin-icon-btn flex-shrink-0" aria-label={`Delete source ${src.num}`}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {sources.length > 0 && (
        <div className="admin-card">
          <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--admin-text-primary)" }}>Legacy Sources (from old format)</h2>
          <p className="text-xs mb-3" style={{ color: "var(--admin-text-subtle)" }}>These are stored in the old JSONB format. Consider migrating them to the new structured sources above.</p>
          <div className="space-y-1">
            {sources.map((s, i) => (
              <div key={i} className="text-xs py-1.5 px-2 rounded" style={{ background: "var(--admin-bg-elevated)", color: "var(--admin-text-secondary)" }}>
                📄 {s}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
