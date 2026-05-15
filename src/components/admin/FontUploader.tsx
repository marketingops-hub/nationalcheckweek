"use client";

import { useState } from "react";
import { adminFetch } from "@/lib/adminFetch";

interface FontUploaderProps {
  onSuccess: () => void;
}

export default function FontUploader({ onSuccess }: FontUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const ext = selectedFile.name.toLowerCase().split(".").pop();
    if (!["woff2", "woff", "ttf"].includes(ext || "")) {
      setError("Invalid file type. Please upload .woff2, .woff, or .ttf files.");
      return;
    }

    // Validate file size (2MB)
    if (selectedFile.size > 2 * 1024 * 1024) {
      setError("File too large. Maximum size is 2MB.");
      return;
    }

    setFile(selectedFile);
    setError("");

    // Auto-generate display name from filename
    if (!displayName) {
      const name = selectedFile.name
        .replace(/\.(woff2|woff|ttf)$/i, "")
        .replace(/[^a-zA-Z0-9\s-]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
      setDisplayName(name);
    }
  }

  async function handleUpload() {
    if (!file) {
      setError("Please select a font file");
      return;
    }

    if (!displayName.trim()) {
      setError("Please enter a display name");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("font", file);
      formData.append("displayName", displayName.trim());

      const res = await adminFetch("/api/admin/typography/fonts", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      // Reset form
      setFile(null);
      setDisplayName("");
      if (document.querySelector('input[type="file"]')) {
        (document.querySelector('input[type="file"]') as HTMLInputElement).value = "";
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload font");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      style={{
        padding: 24,
        background: "var(--color-bg-subtle)",
        border: "2px dashed var(--color-border)",
        borderRadius: 12,
      }}
    >
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
        Upload Custom Font
      </h3>

      {error && (
        <div className="swa-alert swa-alert--error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label className="swa-form-label">Font File</label>
          <input
            type="file"
            accept=".woff2,.woff,.ttf"
            onChange={handleFileChange}
            disabled={uploading}
            className="swa-form-input"
            style={{ padding: 8 }}
          />
          <p style={{ fontSize: 12, color: "var(--color-text-faint)", marginTop: 4 }}>
            Supported formats: .woff2 (recommended), .woff, .ttf · Max size: 2MB
          </p>
        </div>

        <div>
          <label className="swa-form-label">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g., My Custom Font"
            disabled={uploading}
            className="swa-form-input"
          />
          <p style={{ fontSize: 12, color: "var(--color-text-faint)", marginTop: 4 }}>
            This name will appear in the font family dropdown
          </p>
        </div>

        {file && (
          <div
            style={{
              padding: 12,
              background: "var(--color-bg)",
              border: "1px solid var(--color-border-faint)",
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Selected File:</div>
            <div style={{ color: "var(--color-text-faint)" }}>
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleUpload}
            disabled={!file || !displayName.trim() || uploading}
            className="swa-btn swa-btn--primary"
          >
            {uploading ? (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  progress_activity
                </span>
                Uploading...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  upload
                </span>
                Upload Font
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
