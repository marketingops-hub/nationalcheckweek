'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/adminFetch';
import { BlockEditor, parseContent, blocksToHtml, type PageContent } from '@/components/admin/BlockEditor';
import AboutPageEditor from '@/components/admin/AboutPageEditor';
import type { AboutPageContent } from '@/types/cms/about';

interface CmsPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  published: boolean;
}

export default function CmsPageEditor({ page }: { page: CmsPage }) {
  const router = useRouter();
  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug);
  
  // Detect if this is the About page
  const isAboutPage = page.slug === 'about';
  
  // Parse content based on page type
  const [blockContent, setBlockContent] = useState<PageContent>(() => parseContent(page.content));
  const [aboutContent, setAboutContent] = useState<AboutPageContent>(() => {
    if (!isAboutPage) return {} as AboutPageContent;
    try {
      const parsed = typeof page.content === 'string' ? JSON.parse(page.content) : page.content;
      if (parsed.hero && parsed.mission) return parsed;
    } catch (e) {
      // Ignore parse errors
    }
    return {} as AboutPageContent;
  });
  
  const [metaTitle, setMetaTitle] = useState(page.meta_title || '');
  const [metaDescription, setMetaDescription] = useState(page.meta_description || '');
  const [published, setPublished] = useState(page.published);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'preview'>('content');
  const [editorMode, setEditorMode] = useState<'blocks' | 'html'>('blocks');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track changes to content
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [blockContent, aboutContent, title, slug, metaTitle, metaDescription, published]);

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  async function handleSave() {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!slug.trim()) {
      setError('Slug is required');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Convert content based on page type
      let htmlContent: string;
      if (isAboutPage) {
        // For About page, store as JSON
        htmlContent = JSON.stringify(aboutContent);
      } else {
        // For other pages, convert blocks to HTML
        htmlContent = editorMode === 'blocks' ? blocksToHtml(blockContent) : JSON.stringify(blockContent);
      }
      
      const res = await adminFetch(`/api/admin/cms/pages/${page.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          content: htmlContent,
          meta_title: metaTitle.trim() || null,
          meta_description: metaDescription.trim() || null,
          published,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      setSuccess('✓ Saved successfully');
      setHasUnsavedChanges(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${page.title}"? This cannot be undone.`)) return;

    setDeleting(true);
    setError('');

    try {
      const res = await adminFetch(`/api/admin/cms/pages/${page.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }

      router.push('/admin/cms/pages');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setDeleting(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="swa-alert swa-alert--error" style={{ marginBottom: 20 }}>
          {error}
        </div>
      )}
      {success && (
        <div className="swa-alert swa-alert--success" style={{ marginBottom: 20 }}>
          {success}
        </div>
      )}

      {/* Tabs */}
      <div style={{ borderBottom: '2px solid var(--color-border)', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 24 }}>
          <button
            onClick={() => setActiveTab('content')}
            style={{
              padding: '12px 0',
              border: 'none',
              background: 'none',
              fontSize: 14,
              fontWeight: 600,
              color: activeTab === 'content' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'content' ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: -2,
              cursor: 'pointer',
            }}
          >
            📝 Content
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            style={{
              padding: '12px 0',
              border: 'none',
              background: 'none',
              fontSize: 14,
              fontWeight: 600,
              color: activeTab === 'preview' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'preview' ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: -2,
              cursor: 'pointer',
            }}
          >
            👁️ Preview
          </button>
          <button
            onClick={() => setActiveTab('seo')}
            style={{
              padding: '12px 0',
              border: 'none',
              background: 'none',
              fontSize: 14,
              fontWeight: 600,
              color: activeTab === 'seo' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'seo' ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: -2,
              cursor: 'pointer',
            }}
          >
            🔍 SEO & Metadata
          </button>
        </div>
      </div>

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div>
          <div className="swa-card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="swa-form-label">Title *</label>
                <input
                  className="swa-form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Page title"
                />
              </div>

              <div>
                <label className="swa-form-label">Slug *</label>
                <input
                  className="swa-form-input"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="page-slug"
                />
                <div style={{ fontSize: 12, color: 'var(--color-text-faint)', marginTop: 4 }}>
                  URL: /{slug}
                </div>
              </div>

              <div>
                <label className="swa-form-label">Status</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setPublished(!published)}
                    className={`swa-toggle ${published ? 'on' : ''}`}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: published ? 'var(--color-success)' : 'var(--color-text-faint)',
                    }}
                  >
                    {published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Editor - Different for About page */}
          {isAboutPage ? (
            <AboutPageEditor
              initialContent={aboutContent}
              onChange={setAboutContent}
            />
          ) : (
            <BlockEditor
              initialContent={blockContent}
              onChange={setBlockContent}
            />
          )}
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div className="swa-card">
          <div style={{ padding: 24, background: 'white', borderRadius: 8, minHeight: 400 }}>
            {isAboutPage ? (
              <div style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
                Preview the About page at: <a href="/about" target="_blank" style={{ color: 'var(--color-primary)' }}>/about</a>
              </div>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: blocksToHtml(blockContent) }} />
            )}
          </div>
        </div>
      )}

      {/* SEO Tab */}
      {activeTab === 'seo' && (
        <div className="swa-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="swa-form-label">Meta Title</label>
              <input
                className="swa-form-input"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="SEO title (max 60 characters)"
                maxLength={60}
              />
              <div style={{ fontSize: 12, color: 'var(--color-text-faint)', marginTop: 4 }}>
                {metaTitle.length}/60 characters
              </div>
            </div>

            <div>
              <label className="swa-form-label">Meta Description</label>
              <textarea
                className="swa-form-textarea"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={3}
                placeholder="SEO description (max 160 characters)"
                maxLength={160}
              />
              <div style={{ fontSize: 12, color: 'var(--color-text-faint)', marginTop: 4 }}>
                {metaDescription.length}/160 characters
              </div>
            </div>

            {/* Google Preview */}
            <div
              style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--color-text-faint)',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Google Preview
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                nationalcheckinweek.com › {slug}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color: '#1a0dab',
                  marginBottom: 4,
                }}
              >
                {metaTitle || title || 'Page Title'}
              </div>
              <div style={{ fontSize: 13, color: '#545454', lineHeight: 1.4 }}>
                {metaDescription || 'Page description will appear here...'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 24,
          paddingTop: 24,
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <button
          onClick={handleSave}
          disabled={saving}
          className="swa-btn swa-btn--primary"
          style={{ opacity: saving ? 0.6 : 1 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            {saving ? 'hourglass_empty' : 'save'}
          </span>
          {saving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes *' : 'Save Changes'}
        </button>

        <button
          onClick={() => {
            if (hasUnsavedChanges && !confirm('You have unsaved changes. Are you sure you want to leave?')) {
              return;
            }
            router.push('/admin/cms/pages');
          }}
          className="swa-btn"
          style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-body)',
          }}
        >
          Cancel
        </button>

        <div style={{ flex: 1 }} />

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="swa-btn"
          style={{
            background: 'transparent',
            border: '1px solid #EF4444',
            color: '#EF4444',
            opacity: deleting ? 0.6 : 1,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            {deleting ? 'hourglass_empty' : 'delete'}
          </span>
          {deleting ? 'Deleting...' : 'Delete Page'}
        </button>
      </div>
    </div>
  );
}
