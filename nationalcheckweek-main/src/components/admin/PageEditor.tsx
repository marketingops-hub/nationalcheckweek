"use client";

import { useState } from "react";
import { usePageEditor } from "@/hooks/usePageEditor";
import SeoPanel from "@/components/admin/SeoPanel";
import WysiwygPageEditor from "@/components/admin/wysiwyg/WysiwygPageEditor";
import PublishSidebar from "@/components/admin/PublishSidebar";
import type { Page } from "@/components/admin/pageEditorTypes";

const TABS = ["content", "seo", "settings"] as const;

export default function PageEditor({ page }: { page: Page | null }) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("content");

  const {
    isNew,
    title,       setTitle,
    slug,        setSlug,
    description, setDescription,
    blocks,
    status,      setStatus,
    showInMenu,  setShowInMenu,
    metaTitle,   setMetaTitle,
    metaDesc,    setMetaDesc,
    ogImage,     setOgImage,
    saving, deleting, error, success, isDirty,
    addBlock, updateBlock, deleteBlock, reorderBlocks,
    handleSave, handleDelete,
  } = usePageEditor(page);

  return (
    <div className="admin-page-editor">

      {/* ── Main panel ── */}
      <div className="admin-page-editor-main">

        {/* Tab bar */}
        <div className="admin-editor-tabs">
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`admin-editor-tab${activeTab === t ? " active" : ""}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Content tab */}
        {activeTab === "content" && (
          <div className="admin-card">
            {/* Title */}
            <div className="admin-field" style={{ marginBottom: "20px" }}>
              <label className="admin-field-label">Page Title</label>
              <input
                className="admin-title-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="My New Page"
              />
            </div>

            {/* Slug */}
            <div className="admin-field" style={{ marginBottom: "20px" }}>
              <label className="admin-field-label">URL Slug</label>
              <div className="admin-slug-field">
                <span className="admin-slug-prefix">/pages/</span>
                <input
                  className="admin-slug-input"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                />
              </div>
              <p className="admin-field-hint">Full URL: <strong>/pages/{slug || "my-page"}</strong></p>
            </div>

            {/* Description */}
            <div className="admin-field" style={{ marginBottom: "28px" }}>
              <label className="admin-field-label">Short Description</label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Shown in listings and link previews"
              />
            </div>

            {/* WYSIWYG block editor */}
            <WysiwygPageEditor
              blocks={blocks}
              onAdd={(type, insertAt) => addBlock(type, insertAt)}
              onChange={updateBlock}
              onDelete={deleteBlock}
              onReorder={reorderBlocks}
            />
          </div>
        )}

        {/* SEO tab */}
        {activeTab === "seo" && (
          <SeoPanel
            seoTitle={metaTitle}
            seoDesc={metaDesc}
            ogImage={ogImage}
            defaultTitle={title}
            defaultDesc={description}
            onChange={(field, value) => {
              if (field === "seo_title") setMetaTitle(value);
              else if (field === "seo_desc") setMetaDesc(value);
              else setOgImage(value);
            }}
          />
        )}

        {/* Settings tab */}
        {activeTab === "settings" && (
          <div className="admin-card">
            <h2 style={{ marginBottom: "24px" }}>Page Settings</h2>

            <div className="admin-field" style={{ marginBottom: "20px" }}>
              <label className="admin-field-label">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}>
                <option value="draft">Draft — not publicly visible</option>
                <option value="published">Published — live on site</option>
              </select>
            </div>

            <div className="admin-toggle-field">
              <div>
                <div className="admin-toggle-label">Show in navigation menu</div>
                <div className="admin-toggle-hint">Adds this page as a menu item</div>
              </div>
              <button
                role="switch"
                aria-checked={showInMenu}
                onClick={() => setShowInMenu(!showInMenu)}
                className={`admin-toggle${showInMenu ? " on" : ""}`}
              >
                <span className="admin-toggle-thumb" />
              </button>
            </div>
          </div>
        )}
      </div>

      <PublishSidebar
        isNew={isNew}
        slug={slug}
        status={status}
        isDirty={isDirty}
        saving={saving}
        deleting={deleting}
        error={error}
        success={success}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
