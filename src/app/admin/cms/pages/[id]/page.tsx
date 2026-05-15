/**
 * CMS Page Editor Route
 * 
 * Displays the editor interface for a specific CMS page.
 * Wrapped in error boundary to catch and handle rendering errors gracefully.
 * 
 * @module admin/cms/pages/[id]
 */

import { notFound } from "next/navigation";
import { adminClient } from "@/lib/adminClient";
import PageEditor from "@/components/admin/PageEditor";
import ErrorBoundary from "@/components/admin/ErrorBoundary";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPagePage({ params }: Props) {
  const { id } = await params;
  const sb = adminClient();
  const { data: page } = await sb.from("pages").select("*").eq("id", id).single();
  if (!page) notFound();

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <div style={{ fontSize: "0.78rem", color: "#9CA3AF", marginBottom: 4 }}>
            <a href="/admin/cms/pages" style={{ color: "#7C3AED", fontWeight: 600, textDecoration: "none" }}>CMS Pages</a>
            {" / "}Edit
          </div>
          <h1 className="swa-page-title">{page.title}</h1>
          <p className="swa-page-subtitle">/{page.slug}</p>
        </div>
      </div>
      <ErrorBoundary
        fallback={
          <div className="swa-card" style={{ padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Editor Error</h2>
            <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginBottom: 24 }}>
              The page editor encountered an error. Please refresh the page or contact support if the issue persists.
            </p>
            <a href="/admin/cms/pages" className="swa-btn swa-btn--primary">Back to Pages</a>
          </div>
        }
      >
        <PageEditor page={page} />
      </ErrorBoundary>
    </div>
  );
}
