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
  created_at: string;
  updated_at: string;
}

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
    published: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
            published: d.post.published || false,
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
        <button
          onClick={handleDelete}
          className="swa-btn"
          style={{ background: "#FEE2E2", color: "#DC2626", border: "1px solid #FCA5A5" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete</span>
          Delete Post
        </button>
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
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => set("published", e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <span className="swa-form-label" style={{ marginBottom: 0 }}>Published</span>
          </label>
          <p style={{ fontSize: "0.8rem", color: "#9CA3AF", marginTop: 4 }}>
            {form.published ? "This post is visible to the public" : "This post is a draft"}
          </p>
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
      <div className="flex gap-3">
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
        <button
          onClick={() => router.push("/admin/blog")}
          className="swa-btn"
          style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
