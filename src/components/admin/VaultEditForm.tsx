"use client";

import { useState } from "react";
import {
  AdminField,
  FormPanelHeader,
  INPUT_CLS,
  INPUT_STYLE,
  type AdminVaultSource,
} from "@/components/admin/ui";

const CATEGORIES = ["general", "mental health", "education", "government", "research", "statistics", "other"];

interface VaultEditFormProps {
  source: AdminVaultSource;
  busy: boolean;
  error: string;
  onSubmit: (data: { title: string; description: string; category: string }) => Promise<void>;
  onClose: () => void;
}

export default function VaultEditForm({ source, busy, error, onSubmit, onClose }: VaultEditFormProps) {
  const [title, setTitle]             = useState(source.title);
  const [description, setDescription] = useState(source.description);
  const [category, setCategory]       = useState(source.category);

  return (
    <div className="admin-form-panel" role="region" aria-label="Edit vault source">
      <FormPanelHeader
        title="Edit Source"
        subtitle={
          <>
            <span className="font-mono truncate block" style={{ color: "var(--admin-text-faint)", maxWidth: 400 }}>{source.url}</span>
            URL cannot be changed. Delete and re-add to change the URL.
          </>
        }
        onClose={onClose}
        closeLabel="Close edit source form"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <AdminField id="edit-vault-title" label="Title">
          <input
            id="edit-vault-title"
            className={INPUT_CLS}
            style={INPUT_STYLE}
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </AdminField>
        <AdminField id="edit-vault-category" label="Category">
          <select
            id="edit-vault-category"
            className={INPUT_CLS}
            style={INPUT_STYLE}
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </AdminField>
        <AdminField id="edit-vault-desc" label="Description" className="md:col-span-3">
          <textarea
            id="edit-vault-desc"
            rows={2}
            className={INPUT_CLS}
            style={{ ...INPUT_STYLE, resize: "none" }}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </AdminField>
      </div>

      {error && <div className="admin-alert admin-alert-error mb-6" role="alert">{error}</div>}
      <div className="flex gap-3">
        <button
          onClick={() => onSubmit({ title: title.trim(), description: description.trim(), category })}
          disabled={busy}
          className="admin-btn admin-btn-primary"
          style={{ opacity: busy ? 0.6 : 1 }}
        >
          {busy ? "Saving…" : "Save Changes"}
        </button>
        <button onClick={onClose} className="admin-btn admin-btn-secondary">Cancel</button>
      </div>
    </div>
  );
}
