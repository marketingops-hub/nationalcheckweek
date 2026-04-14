"use client";

import { useRouter } from "next/navigation";

interface PublishSidebarProps {
  isNew:     boolean;
  slug:      string;
  status:    string;
  isDirty:   boolean;
  saving:    boolean;
  deleting:  boolean;
  error:     string;
  success:   string;
  onSave:    (publishNow?: boolean) => void;
  onDelete:  () => void;
}

export default function PublishSidebar({
  isNew, slug, status, isDirty, saving, deleting, error, success, onSave, onDelete,
}: PublishSidebarProps) {
  const router = useRouter();

  return (
    <div className="admin-page-editor-sidebar">

      <div className="admin-card admin-publish-card">
        <div className="admin-section-label" style={{ marginBottom: "16px", borderBottom: "none", paddingBottom: 0 }}>Publish</div>

        <div className="admin-publish-status">
          <span className={`admin-status-dot${status === "published" ? " published" : ""}`} />
          <span>{status === "published" ? "Published" : "Draft"}</span>
          {isDirty && <span className="admin-unsaved-badge">Unsaved</span>}
        </div>

        {error   && <div className="admin-alert admin-alert-error">{error}</div>}
        {success && <div className="admin-alert admin-alert-success">{success}</div>}

        <div className="admin-publish-actions">
          <button
            onClick={() => onSave()}
            disabled={saving}
            className="admin-btn admin-btn-secondary"
            style={{ width: "100%" }}
          >
            {saving ? "Saving…" : "Save Draft"}
          </button>

          {status !== "published" && (
            <button
              onClick={() => onSave(true)}
              disabled={saving}
              className="admin-btn admin-btn-primary"
              style={{ width: "100%" }}
            >
              Publish
            </button>
          )}

          {status === "published" && !isNew && (
            <a
              href={`/pages/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn-ghost"
              style={{ width: "100%" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              View Page
            </a>
          )}

          <button
            onClick={() => router.push("/admin/cms/pages")}
            className="admin-btn admin-btn-ghost"
            style={{ width: "100%" }}
          >
            ← All Pages
          </button>
        </div>
      </div>

      {!isNew && (
        <div className="admin-card admin-danger-card">
          <div className="admin-section-label" style={{ marginBottom: "12px", borderBottom: "none", paddingBottom: 0 }}>Danger Zone</div>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="admin-btn admin-btn-danger"
            style={{ width: "100%" }}
          >
            {deleting ? "Deleting…" : "Delete Page"}
          </button>
        </div>
      )}
    </div>
  );
}
