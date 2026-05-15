"use client";

import { useState } from "react";
import HomepageBlocksEditor from "@/components/admin/HomepageBlocksEditor";
import GlobalColorsEditor from "@/components/admin/GlobalColorsEditor";

type Tab = "blocks" | "colors";

export default function HomepageBuilderPage() {
  const [activeTab, setActiveTab] = useState<Tab>("blocks");

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Homepage Builder</h1>
          <p className="swa-page-subtitle">
            Manage your homepage content blocks and global color scheme
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--color-border)", marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab("blocks")}
          style={{
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 600,
            background: "none",
            border: "none",
            cursor: "pointer",
            borderBottom: activeTab === "blocks" ? "2px solid var(--color-primary)" : "2px solid transparent",
            marginBottom: -2,
            color: activeTab === "blocks" ? "var(--color-primary)" : "var(--color-text-muted)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            widgets
          </span>
          Content Blocks
        </button>
        <button
          onClick={() => setActiveTab("colors")}
          style={{
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 600,
            background: "none",
            border: "none",
            cursor: "pointer",
            borderBottom: activeTab === "colors" ? "2px solid var(--color-primary)" : "2px solid transparent",
            marginBottom: -2,
            color: activeTab === "colors" ? "var(--color-primary)" : "var(--color-text-muted)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            palette
          </span>
          Global Colors
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "blocks" && <HomepageBlocksEditor />}
      {activeTab === "colors" && <GlobalColorsEditor />}
    </div>
  );
}
