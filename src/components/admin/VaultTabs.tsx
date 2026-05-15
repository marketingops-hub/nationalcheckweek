"use client";

import { useState } from "react";

interface VaultTabsProps {
  sourcesContent: React.ReactNode;
  blocksContent: React.ReactNode;
  sourceCount: number;
  blockCount: number;
}

export default function VaultTabs({ sourcesContent, blocksContent, sourceCount, blockCount }: VaultTabsProps) {
  const [tab, setTab] = useState<"sources" | "content">("sources");

  const TABS = [
    { id: "sources" as const, label: "Approved Sources", count: sourceCount, icon: "link" },
    { id: "content" as const, label: "Content Blocks",   count: blockCount,  icon: "description" },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 2,
          marginBottom: 24,
          padding: 6,
          borderRadius: "var(--radius-lg)",
          background: "var(--color-primary-pale)",
          border: "1px solid var(--color-primary-light)",
        }}
      >
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "10px 16px",
              borderRadius: "var(--radius-md)",
              fontSize: 13,
              fontWeight: tab === t.id ? 600 : 500,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: tab === t.id ? "var(--color-card)" : "transparent",
              color: tab === t.id ? "var(--color-text-primary)" : "var(--color-text-muted)",
              boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{t.icon}</span>
            {t.label}
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 9999,
                background: tab === t.id ? "var(--color-primary-light)" : "var(--color-border)",
                color: tab === t.id ? "var(--color-primary)" : "var(--color-text-faint)",
              }}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "sources" && sourcesContent}
      {tab === "content" && blocksContent}
    </div>
  );
}
