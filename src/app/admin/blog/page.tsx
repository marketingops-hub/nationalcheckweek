"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/adminFetch";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published: boolean;
  published_at: string | null;
  review_status?: 'draft' | 'pending' | 'approved' | 'rejected';
  created_at: string;
  author: string | null;
}

type Filter = 'all' | 'pending' | 'published' | 'draft' | 'rejected';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Pending review' },
  { key: 'published', label: 'Published' },
  { key: 'draft',     label: 'Drafts' },
  { key: 'rejected',  label: 'Rejected' },
];

/** review_status falls back for pre-migration rows. */
function reviewOf(p: BlogPost): 'draft' | 'pending' | 'approved' | 'rejected' {
  return p.review_status ?? (p.published ? 'approved' : 'draft');
}

function statusChip(p: BlogPost): { bg: string; color: string; label: string } {
  if (p.published)              return { bg: '#D1FAE5', color: '#065F46', label: 'Published' };
  const rs = reviewOf(p);
  if (rs === 'pending')         return { bg: '#FEF3C7', color: '#92400E', label: 'Pending review' };
  if (rs === 'rejected')        return { bg: '#FEE2E2', color: '#991B1B', label: 'Rejected' };
  if (rs === 'approved')        return { bg: '#DBEAFE', color: '#1D4ED8', label: 'Approved · unpublished' };
  return { bg: '#FFF7ED', color: '#EA580C', label: 'Draft' };
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>('all');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    adminFetch("/api/admin/blog?all=true")
      .then((r) => r.json())
      .then((d) => {
        setPosts(d.posts ?? []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  async function togglePublish(id: string, current: boolean) {
    setPosts((posts) => posts.map((p) => (p.id === id ? { ...p, published: !current } : p)));
    const res = await adminFetch(`/api/admin/blog/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !current }),
    });
    if (!res.ok) {
      setPosts((posts) => posts.map((p) => (p.id === id ? { ...p, published: current } : p)));
      setError("Failed to update publish status");
    }
  }

  async function approve(id: string) {
    setBusy(id);
    try {
      const res = await adminFetch(`/api/admin/blog/${id}/approve`, { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Approve failed");
      setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, ...d.post } : p)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setBusy(null);
    }
  }

  async function deletePost(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const prev = posts;
    setPosts((posts) => posts.filter((p) => p.id !== id));
    const res = await adminFetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setPosts(prev);
      setError("Failed to delete post");
    }
  }

  const pendingCount = posts.filter((p) => reviewOf(p) === 'pending').length;
  const filtered = posts.filter((p) => {
    if (filter === 'all')       return true;
    if (filter === 'published') return p.published;
    return reviewOf(p) === filter;   // pending / draft / rejected
  });

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Blog</h1>
          <p className="swa-page-subtitle">
            {loading ? "Loading…" : `${posts.length} post${posts.length !== 1 ? "s" : ""}`} · manage blog content
          </p>
        </div>
        <Link href="/admin/blog/new" className="swa-btn swa-btn--primary">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          New Post
        </Link>
      </div>

      {error && <div className="swa-alert swa-alert--error" style={{ marginBottom: 20 }}>{error}</div>}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="swa-btn"
            style={{
              fontSize: 13,
              background: filter === f.key ? "#1b4673" : "#fff",
              color: filter === f.key ? "#fff" : "#374151",
              border: "1px solid #E5E7EB",
              fontWeight: filter === f.key ? 700 : 500,
            }}
          >
            {f.label}
            {f.key === "pending" && pendingCount > 0 && (
              <span style={{ marginLeft: 6, background: "#FEF3C7", color: "#92400E", borderRadius: 999, padding: "0 7px", fontSize: 11, fontWeight: 700 }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9CA3AF" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, display: "block", marginBottom: 12 }}>
            hourglass_empty
          </span>
          Loading posts…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#9CA3AF" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, display: "block", marginBottom: 16 }}>
            article
          </span>
          <h3 style={{ color: "#1b4673", marginBottom: 8 }}>
            {filter === 'all' ? 'No blog posts yet' : `No ${FILTERS.find((f) => f.key === filter)?.label.toLowerCase()} posts`}
          </h3>
          {filter === 'all' && (
            <>
              <p style={{ marginBottom: 20 }}>Create your first blog post to get started.</p>
              <Link href="/admin/blog/new" className="swa-btn swa-btn--primary">Create a post</Link>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((post) => (
            <div
              key={post.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                padding: "16px 20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1b4673" }}>{post.title}</span>
                  {(() => {
                    const c = statusChip(post);
                    return (
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 100, background: c.bg, color: c.color, textTransform: "uppercase" }}>
                        {c.label}
                      </span>
                    );
                  })()}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#9CA3AF" }}>
                  {post.excerpt && <span>{post.excerpt.substring(0, 120)}...</span>}
                  {post.author && <span> · by {post.author}</span>}
                  <span> · {new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                {reviewOf(post) === 'pending' && (
                  <button
                    onClick={() => approve(post.id)}
                    disabled={busy === post.id}
                    className="swa-btn swa-btn--primary"
                    style={{ fontSize: 12 }}
                    title="Approve and publish this post"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                    {busy === post.id ? "Approving…" : "Approve"}
                  </button>
                )}
                {/* Publish/unpublish toggle only for approved posts — publishing
                    anything else is gated behind the review flow. */}
                {reviewOf(post) === 'approved' && (
                  <button
                    onClick={() => togglePublish(post.id, post.published)}
                    title={post.published ? "Unpublish" : "Publish"}
                    className="swa-icon-btn"
                    style={{ color: post.published ? "#16A34A" : "#9CA3AF" }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {post.published ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                )}
                <Link href={`/admin/blog/${post.id}`} className="swa-icon-btn" title="Edit">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                </Link>
                <button
                  onClick={() => deletePost(post.id, post.title)}
                  className="swa-icon-btn"
                  title="Delete"
                  style={{ color: "#EF4444" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
