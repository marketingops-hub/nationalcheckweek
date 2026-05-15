"use client";

import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/adminFetch";
import FontUploader from "./FontUploader";

interface CustomFont {
  id: string;
  font_name: string;
  display_name: string;
  file_url: string;
  file_format: string;
  file_size: number;
  uploaded_at: string;
  is_active: boolean;
}

interface FontManagerProps {
  onFontUploaded: () => void;
}

export default function FontManager({ onFontUploaded }: FontManagerProps) {
  const [fonts, setFonts] = useState<CustomFont[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    fetchFonts();
  }, []);

  async function fetchFonts() {
    try {
      const res = await adminFetch("/api/admin/typography/fonts");
      const data = await res.json();
      setFonts(data.fonts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fonts");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(font: CustomFont) {
    if (!confirm(`Delete font "${font.display_name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await adminFetch(`/api/admin/typography/fonts/${font.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete font");
      }

      setFonts(fonts.filter((f) => f.id !== font.id));
      onFontUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete font");
    }
  }

  function handleUploadSuccess() {
    setShowUploader(false);
    fetchFonts();
    onFontUploaded();
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return (
    <div className="swa-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
            Custom Fonts
          </h2>
          <p style={{ fontSize: 13, color: "var(--color-text-faint)" }}>
            Upload custom fonts to use across your site
          </p>
        </div>
        <button
          onClick={() => setShowUploader(!showUploader)}
          className="swa-btn swa-btn--primary"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            {showUploader ? "close" : "upload"}
          </span>
          {showUploader ? "Cancel" : "Upload Font"}
        </button>
      </div>

      {error && (
        <div className="swa-alert swa-alert--error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {showUploader && (
        <div style={{ marginBottom: 24 }}>
          <FontUploader onSuccess={handleUploadSuccess} />
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-faint)" }}>
          Loading fonts...
        </div>
      ) : fonts.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-faint)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, display: "block", marginBottom: 12, opacity: 0.3 }}>
            font_download
          </span>
          <p>No custom fonts uploaded yet.</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>
            Upload .woff2, .woff, or .ttf files (max 2MB)
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {fonts.map((font) => (
            <div
              key={font.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16,
                background: "var(--color-bg-subtle)",
                border: "1px solid var(--color-border-faint)",
                borderRadius: 8,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {font.display_name}
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-faint)" }}>
                  {font.font_name} · {font.file_format.toUpperCase()} · {formatFileSize(font.file_size)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <a
                  href={font.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="swa-icon-btn"
                  title="Download"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    download
                  </span>
                </a>
                <button
                  onClick={() => handleDelete(font)}
                  className="swa-icon-btn"
                  title="Delete"
                  style={{ color: "#EF4444" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    delete
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
