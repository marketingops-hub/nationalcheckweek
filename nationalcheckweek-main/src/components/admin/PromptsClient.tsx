"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface PromptTemplate {
  id: string;
  page_type: string;
  section_key: string;
  label: string;
  prompt: string;
  model: string;
  updated_at: string;
}

export default function PromptsClient({
  initialPrompts,
}: {
  initialPrompts: PromptTemplate[];
}) {
  const [prompts, setPrompts] = useState<PromptTemplate[]>(initialPrompts);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  function startEdit(p: PromptTemplate) {
    setEditing(p.id);
    setDraft(p.prompt);
  }

  function cancelEdit() {
    setEditing(null);
    setDraft("");
  }

  async function savePrompt(id: string) {
    setSaving(true);
    const sb = createClient();
    const { error } = await sb
      .from("prompt_templates")
      .update({ prompt: draft })
      .eq("id", id);
    setSaving(false);
    if (error) {
      setToast(`Error: ${error.message}`);
    } else {
      setPrompts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, prompt: draft } : p))
      );
      setToast("Prompt saved.");
      setEditing(null);
      setDraft("");
    }
    setTimeout(() => setToast(""), 3000);
  }

  const grouped = prompts.reduce<Record<string, PromptTemplate[]>>((acc, p) => {
    (acc[p.page_type] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {toast && (
        <div
          className={`admin-alert ${toast.startsWith("Error") ? "admin-alert-error" : "admin-alert-success"}`}
        >
          {toast}
        </div>
      )}

      {Object.entries(grouped).map(([pageType, items]) => (
        <div key={pageType} className="admin-card" style={{ padding: "24px" }}>
          <h2
            className="text-base font-bold mb-4 capitalize"
            style={{ color: "var(--admin-text-primary)" }}
          >
            {pageType.replace(/_/g, " ")} Prompts
          </h2>
          <div className="space-y-4">
            {items.map((p) => (
              <div
                key={p.id}
                style={{
                  border: "1px solid var(--admin-border)",
                  borderRadius: "var(--admin-radius-md)",
                  padding: "16px",
                  background: editing === p.id ? "var(--admin-bg-elevated)" : "#fff",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--admin-text-primary)" }}
                    >
                      {p.label}
                    </span>
                    <span
                      className="ml-2 text-xs"
                      style={{ color: "var(--admin-text-faint)" }}
                    >
                      {p.section_key} · {p.model}
                    </span>
                  </div>
                  {editing !== p.id ? (
                    <button
                      className="admin-btn admin-btn-sm admin-btn-ghost"
                      onClick={() => startEdit(p)}
                    >
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        className="admin-btn admin-btn-sm admin-btn-ghost"
                        onClick={cancelEdit}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button
                        className="admin-btn admin-btn-sm admin-btn-primary"
                        onClick={() => savePrompt(p.id)}
                        disabled={saving}
                      >
                        {saving ? "Saving…" : "Save"}
                      </button>
                    </div>
                  )}
                </div>

                {editing === p.id ? (
                  <textarea
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                    style={{
                      background: "#fff",
                      border: "1px solid var(--admin-border-strong)",
                      color: "var(--admin-text-primary)",
                      minHeight: 120,
                      fontFamily: "inherit",
                      resize: "vertical",
                      lineHeight: 1.6,
                    }}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                ) : (
                  <pre
                    className="text-sm whitespace-pre-wrap"
                    style={{
                      color: "var(--admin-text-muted)",
                      lineHeight: 1.6,
                      margin: 0,
                      fontFamily: "inherit",
                    }}
                  >
                    {p.prompt}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
