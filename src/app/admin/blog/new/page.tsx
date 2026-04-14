"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/adminFetch";
import RichTextEditor from "@/components/admin/RichTextEditor";

export default function NewBlogPostPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    author: "",
    published: false,
  });
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [aiSettings, setAiSettings] = useState({
    style: "professional",
    length: "medium",
  });

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleAIGenerate() {
    if (!form.title) {
      setError("Please enter a title first");
      return;
    }

    setGenerating(true);
    setError("");

    try {
      const res = await adminFetch("/api/admin/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          style: aiSettings.style,
          length: aiSettings.length,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setForm((f) => ({
        ...f,
        content: data.content || "",
        excerpt: data.excerpt || "",
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!form.title || !form.slug) {
      setError("Title and slug are required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await adminFetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Save failed");
      }

      router.push(`/admin/blog/${data.post.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold mb-2" style={{ color: "var(--admin-text-primary)" }}>
          Create Blog Post
        </h1>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error mb-5" role="alert">
          {error}
        </div>
      )}

      {/* AI Generation Panel */}
      <div className="admin-card mb-6">
        <h3 className="font-semibold mb-4" style={{ color: "var(--admin-text-primary)" }}>
          ✨ AI Content Generation
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="swa-form-label">Writing Style</label>
            <select
              className="swa-form-input"
              value={aiSettings.style}
              onChange={(e) => setAiSettings((s) => ({ ...s, style: e.target.value }))}
            >
              <option value="professional">Professional</option>
              <option value="conversational">Conversational</option>
              <option value="academic">Academic</option>
              <option value="storytelling">Storytelling</option>
            </select>
          </div>
          <div>
            <label className="swa-form-label">Length</label>
            <select
              className="swa-form-input"
              value={aiSettings.length}
              onChange={(e) => setAiSettings((s) => ({ ...s, length: e.target.value }))}
            >
              <option value="short">Short (400-600 words)</option>
              <option value="medium">Medium (800-1200 words)</option>
              <option value="long">Long (1500-2000 words)</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleAIGenerate}
          disabled={generating || !form.title}
          className="px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
          style={{
            background: generating || !form.title ? "var(--admin-border)" : "var(--admin-accent)",
            color: "#fff",
            opacity: generating || !form.title ? 0.5 : 1,
            cursor: generating || !form.title ? "not-allowed" : "pointer",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            {generating ? "hourglass_empty" : "auto_awesome"}
          </span>
          {generating ? "Generating..." : "Generate Content with AI"}
        </button>
      </div>

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
          {saving ? "Saving..." : "Save Post"}
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
