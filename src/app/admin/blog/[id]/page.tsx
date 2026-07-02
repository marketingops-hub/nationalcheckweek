"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { adminFetch } from "@/lib/adminFetch";
import RichTextEditor from "@/components/admin/RichTextEditor";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  author: string | null;
  published: boolean;
  published_at: string | null;
  review_status?: 'draft' | 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  submitted_by?: string | null;
  reviewed_by?: string | null;
  created_at: string;
  updated_at: string;
}

const REVIEW_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  draft:    { bg: '#F3F4F6', color: '#374151', label: 'Draft' },
  pending:  { bg: '#FEF3C7', color: '#92400E', label: 'Pending review' },
  approved: { bg: '#D1FAE5', color: '#065F46', label: 'Approved' },
  rejected: { bg: '#FEE2E2', color: '#991B1B', label: 'Rejected' },
};

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    author: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reviewBusy, setReviewBusy] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen]   = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (!id) return;
    
    adminFetch(`/api/admin/blog/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.post) {
          setPost(d.post);
          setForm({
            title: d.post.title || "",
            slug: d.post.slug || "",
            excerpt: d.post.excerpt || "",
            content: d.post.content || "",
            author: d.post.author || "",
          });
        }
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [id]);

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!form.title || !form.slug) {
      setError("Title and slug are required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await adminFetch(`/api/admin/blog/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Save failed");
      }

      setPost(data.post);
      router.push("/admin/blog");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function doReviewAction(action: 'submit-review' | 'approve' | 'reject', body?: object) {
    setReviewBusy(action); setError("");
    try {
      const res = await adminFetch(`/api/admin/blog/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `${action} failed`);
      setPost(data.post);
      setRejectOpen(false); setRejectReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : `${action} failed`);
    } finally {
      setReviewBusy(null);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${form.title}"? This cannot be undone.`)) return;

    try {
      const res = await adminFetch(`/api/admin/blog/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/admin/blog");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "#9CA3AF" }}>
        <span className="material-symbols-outlined" style={{ fontSize: 40, display: "block", marginBottom: 12 }}>
          hourglass_empty
        </span>
        Loading post…
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <h2>Post not found</h2>
        <button onClick={() => router.push("/admin/blog")} className="swa-btn swa-btn--primary" style={{ marginTop: 16 }}>
          Back to Blog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold mb-2" style={{ color: "var(--admin-text-primary)" }}>
            Edit Blog Post
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#9CA3AF" }}>
            Last updated: {new Date(post.updated_at).toLocaleString()}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {form.slug && (
            <a
              href={`/blog/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="swa-btn"
              style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>open_in_new</span>
              {post?.published ? "View on site" : "Preview"}
            </a>
          )}
          <button
            onClick={handleDelete}
            className="swa-btn"
            style={{ background: "#FEE2E2", color: "#DC2626", border: "1px solid #FCA5A5" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete</span>
            Delete Post
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error mb-5" role="alert">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="admin-card mb-6">
        <div className="mb-4">
          <label className="swa-form-label">Title *</label>
          <input
            className="swa-form-input"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Enter blog post title..."
          />
        </div>
        <div className="mb-4">
          <label className="swa-form-label">URL Slug *</label>
          <input
            className="swa-form-input"
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            placeholder="url-friendly-slug"
          />
        </div>
        <div className="mb-4">
          <label className="swa-form-label">Author</label>
          <input
            className="swa-form-input"
            value={form.author}
            onChange={(e) => set("author", e.target.value)}
            placeholder="Author name"
          />
        </div>
        <div className="mb-4">
          <label className="swa-form-label">Excerpt</label>
          <textarea
            className="swa-form-textarea"
            rows={3}
            value={form.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            placeholder="Brief summary of the post..."
          />
        </div>
        <div>
          {(() => {
            const rs = post?.review_status ?? 'draft';
            const st = REVIEW_STYLE[rs] ?? REVIEW_STYLE.draft;
            const canSubmit = rs === 'draft' || rs === 'rejected';
            const isPending = rs === 'pending';
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="swa-form-label" style={{ marginBottom: 0 }}>Publication status</span>
                  <span style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 999, textTransform: 'uppercase' }}>{st.label}</span>
                </div>
                {rs === 'rejected' && post?.rejection_reason && (
                  <div style={{ padding: '8px 12px', background: '#FEF2F2', borderRadius: 6, fontSize: 12, color: '#991B1B' }}>
                    <strong>Sent back:</strong> {post.rejection_reason} — revise, then resubmit.
                  </div>
                )}
                <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: 0 }}>
                  {rs === 'pending'
                    ? 'Awaiting review — an approver will publish or send it back.'
                    : rs === 'approved'
                      ? 'Approved. Editing the content and saving will send it back for review before changes go live.'
                      : 'Blog posts publish only after approval. Save your edits, then submit for review.'}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {canSubmit && (
                    <button onClick={() => doReviewAction('submit-review')} disabled={!!reviewBusy} className="swa-btn swa-btn--primary" style={{ fontSize: 13 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>rate_review</span>
                      {reviewBusy === 'submit-review' ? 'Submitting…' : rs === 'rejected' ? 'Resubmit for review' : 'Submit for review'}
                    </button>
                  )}
                  {isPending && (
                    <>
                      <button onClick={() => doReviewAction('approve')} disabled={!!reviewBusy} className="swa-btn swa-btn--primary" style={{ fontSize: 13 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>check_circle</span>
                        {reviewBusy === 'approve' ? 'Approving…' : 'Approve & publish'}
                      </button>
                      <button onClick={() => setRejectOpen((v) => !v)} disabled={!!reviewBusy} className="swa-btn" style={{ fontSize: 13, color: '#DC2626' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>cancel</span>
                        {rejectOpen ? 'Cancel' : 'Reject'}
                      </button>
                    </>
                  )}
                </div>
                {rejectOpen && (
                  <div style={{ padding: 12, background: '#FEF2F2', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="Reason (shown to the author)…" style={{ padding: '8px 10px', border: '1px solid #FECACA', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => doReviewAction('reject', { reason: rejectReason.trim() })} disabled={!!reviewBusy} className="swa-btn" style={{ fontSize: 13, background: '#DC2626', color: '#fff', borderColor: '#DC2626' }}>
                        {reviewBusy === 'reject' ? 'Rejecting…' : 'Confirm rejection'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Content */}
      <div className="admin-card mb-6">
        <label className="swa-form-label mb-2">Content</label>
        <RichTextEditor
          value={form.content}
          onChange={(v) => set("content", v)}
          placeholder="Write your blog post content..."
          minHeight={400}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleSave}
          disabled={saving || !form.title || !form.slug}
          className="swa-btn swa-btn--primary"
          style={{ opacity: saving || !form.title || !form.slug ? 0.5 : 1 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
            {saving ? "hourglass_empty" : "save"}
          </span>
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {form.slug && (
          <a
            href={`/blog/${form.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="swa-btn"
            style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>open_in_new</span>
            {post?.published ? "View on site" : "Preview"}
          </a>
        )}
        <button
          onClick={() => router.push("/admin/blog")}
          className="swa-btn"
          style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
