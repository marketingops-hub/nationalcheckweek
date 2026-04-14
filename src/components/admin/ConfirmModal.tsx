"use client";

import { useEffect } from "react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ open, title, message, confirmLabel = "Delete", onConfirm, onCancel }: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 shadow-2xl"
        style={{ background: "var(--admin-bg-surface)", border: "1px solid var(--admin-border-strong)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
          style={{ background: "var(--admin-danger-bg)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--admin-danger-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </div>

        <h3 className="text-[15px] font-semibold mb-2" style={{ color: "var(--admin-text-primary)" }}>{title}</h3>
        <p className="text-sm mb-6" style={{ color: "var(--admin-text-subtle)" }}>{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="admin-btn admin-btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="admin-btn admin-btn-danger flex-1"
          >
            {confirmLabel}
          </button>
        </div>

        <p className="text-center text-xs mt-3" style={{ color: "var(--admin-text-faint)" }}>
          Press <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: "var(--admin-bg-elevated)", color: "var(--admin-text-muted)" }}>Esc</kbd> to cancel
        </p>
      </div>
    </div>
  );
}
