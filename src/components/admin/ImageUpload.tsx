"use client";

import { useState, useRef } from "react";
import { adminFetch } from "@/lib/adminFetch";

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  description?: string;
  accept?: string;
}

export default function ImageUpload({ label, value, onChange, description, accept = "image/*" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await adminFetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setError("");
    onChange(url);
  };

  return (
    <div className="swa-form-group">
      <label className="swa-label">
        {label}
        {description && <span className="swa-label-hint">{description}</span>}
      </label>

      {error && (
        <div style={{ padding: "0.75rem", backgroundColor: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: "6px", marginBottom: "0.75rem" }}>
          <p style={{ color: "#DC2626", fontSize: "0.875rem", margin: 0 }}>{error}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://example.com/image.png or upload below"
            className="swa-input"
            style={{ marginBottom: "0.5rem" }}
          />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="swa-btn"
              style={{
                background: "var(--color-primary)",
                color: "#fff",
                border: "none",
                fontSize: "0.875rem",
                padding: "0.5rem 1rem",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                upload
              </span>
              {uploading ? "Uploading..." : "Upload Image"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
          </div>
        </div>

        {value && (
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "8px",
              border: "2px solid var(--color-border)",
              overflow: "hidden",
              backgroundColor: "var(--color-bg-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={value}
              alt="Preview"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).parentElement!.innerHTML = '<span style="color: var(--color-text-muted); font-size: 0.75rem;">Invalid image</span>';
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
