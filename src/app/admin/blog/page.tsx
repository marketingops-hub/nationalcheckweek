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
  created_at: string;
  author: string | null;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9CA3AF" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, display: "block", marginBottom: 12 }}>
            hourglass_empty
          </span>
          Loading posts…
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#9CA3AF" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, display: "block", marginBottom: 16 }}>
            article
          </span>
          <h3 style={{ color: "#1E1040", marginBottom: 8 }}>No blog posts yet</h3>
          <p style={{ marginBottom: 20 }}>Create your first blog post to get started.</p>
          <Link href="/admin/blog/new" className="swa-btn swa-btn--primary">
            Create a post
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {posts.map((post) => (
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
                  <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1E1040" }}>{post.title}</span>
                  {!post.published && (
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 100,
                        background: "#FFF7ED",
                        color: "#EA580C",
                        textTransform: "uppercase",
                      }}
                    >
                      Draft
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#9CA3AF" }}>
                  {post.excerpt && <span>{post.excerpt.substring(0, 120)}...</span>}
                  {post.author && <span> · by {post.author}</span>}
                  <span> · {new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
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
