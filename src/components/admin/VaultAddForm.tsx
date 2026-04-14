"use client";

import { useState } from "react";
import { adminFetch } from "@/lib/adminFetch";
import {
  AdminField,
  FormPanelHeader,
  INPUT_CLS,
  INPUT_STYLE,
  inputStyle,
  type FieldErrors,
} from "@/components/admin/ui";

const CATEGORIES = ["general", "mental health", "education", "government", "research", "statistics", "other"];

function validateUrl(url: string): FieldErrors {
  const errs: FieldErrors = {};
  if (!url) { errs.url = "URL is required."; return errs; }
  try { new URL(url); } catch { errs.url = "Enter a valid URL starting with http:// or https://"; }
  return errs;
}

interface VaultAddFormProps {
  busy: boolean;
  error: string;
  onSubmit: (data: { url: string; title: string; description: string; category: string }) => Promise<void>;
  onClose: () => void;
}

export default function VaultAddForm({ busy, error, onSubmit, onClose }: VaultAddFormProps) {
  const [url, setUrl]               = useState("");
  const [title, setTitle]           = useState("");
  const [desc, setDesc]             = useState("");
  const [cat, setCat]               = useState("general");
  const [crawling, setCrawling]     = useState(false);
  const [crawlMsg, setCrawlMsg]     = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function crawlUrl(u: string) {
    try { new URL(u); } catch { return; }
    setCrawling(true); setCrawlMsg("Crawling page…");
    try {
      const res = await adminFetch("/api/admin/firecrawl/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u }),
      });
      const json = await res.json();
      if (!res.ok) { setCrawlMsg(json.error || "Crawl failed."); return; }
      if (json.title && !title) setTitle(json.title);
      if (json.description && !desc) setDesc(json.description);
      setCrawlMsg("Crawled successfully!");
    } catch {
      setCrawlMsg("Network error during crawl.");
    } finally {
      setCrawling(false);
    }
  }

  async function handleSubmit() {
    const trimmed = url.trim();
    const errs = validateUrl(trimmed);
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    await onSubmit({ url: trimmed, title: title.trim(), description: desc.trim(), category: cat });
  }

  return (
    <div className="admin-form-panel" role="region" aria-label="Add vault source">
      <FormPanelHeader
        title={
          <>
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--admin-accent)" }}>The Vault</div>
            Add Approved Source
          </>
        }
        subtitle="Paste a URL below. OpenAI will only use approved vault sources when generating content."
        onClose={onClose}
        closeLabel="Close add source form"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <AdminField id="vault-url" label="URL — paste here" error={fieldErrors.url} className="md:col-span-2">
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <textarea
              id="vault-url"
              rows={2}
              className={INPUT_CLS}
              style={{ ...inputStyle(!!fieldErrors.url), resize: "none", fontFamily: "monospace", fontSize: "0.8rem", flex: 1 }}
              value={url}
              onChange={e => { setUrl(e.target.value); setFieldErrors(f => ({ ...f, url: "" })); setCrawlMsg(""); }}
              placeholder="https://www.aihw.gov.au/reports/mental-health/..."
              autoFocus
            />
            <button
              type="button"
              onClick={() => crawlUrl(url.trim())}
              disabled={crawling || !url.trim()}
              className="swa-btn swa-btn--primary"
              style={{ whiteSpace: "nowrap", opacity: (crawling || !url.trim()) ? 0.6 : 1, marginTop: 2 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                {crawling ? "hourglass_top" : "travel_explore"}
              </span>
              {crawling ? "Crawling…" : "Crawl"}
            </button>
          </div>
          {crawlMsg && (
            <div style={{
              fontSize: 12, marginTop: 6, fontWeight: 500,
              color: crawlMsg.includes("successfully") ? "var(--color-success)"
                : crawlMsg.includes("Crawling") ? "var(--color-primary)"
                : "var(--color-error)",
            }}>
              {crawlMsg}
            </div>
          )}
        </AdminField>

        <AdminField
          id="vault-title"
          label={<>Title <span style={{ color: "var(--admin-text-faint)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></>}
        >
          <input
            id="vault-title"
            className={INPUT_CLS}
            style={INPUT_STYLE}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. AIHW Mental Health Report 2023"
          />
        </AdminField>

        <AdminField id="vault-category" label="Category">
          <select id="vault-category" className={INPUT_CLS} style={INPUT_STYLE} value={cat} onChange={e => setCat(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </AdminField>

        <AdminField
          id="vault-desc"
          label={<>Description <span style={{ color: "var(--admin-text-faint)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></>}
          className="md:col-span-2"
        >
          <textarea
            id="vault-desc"
            rows={2}
            className={INPUT_CLS}
            style={{ ...INPUT_STYLE, resize: "none" }}
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Brief note about what this source covers…"
          />
        </AdminField>
      </div>

      {error && <div className="admin-alert admin-alert-error mb-6" role="alert">{error}</div>}
      <div className="flex gap-3">
        <button onClick={handleSubmit} disabled={busy} className="admin-btn admin-btn-primary" style={{ opacity: busy ? 0.6 : 1 }}>
          {busy ? "Adding…" : "Add to Vault"}
        </button>
        <button onClick={onClose} className="admin-btn admin-btn-secondary">Cancel</button>
      </div>
    </div>
  );
}
