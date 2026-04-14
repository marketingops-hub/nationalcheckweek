"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "primary";
}

/**
 * Accessible confirmation dialog component.
 * Replaces native confirm() with a proper modal that supports keyboard navigation,
 * focus trapping, and screen readers.
 * 
 * @example
 * ```tsx
 * <ConfirmDialog
 *   isOpen={showDeleteDialog}
 *   title="Delete Logo"
 *   message={`Are you sure you want to delete "${logoName}"?`}
 *   confirmText="Delete"
 *   cancelText="Cancel"
 *   variant="danger"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowDeleteDialog(false)}
 * />
 * ```
 */
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "primary",
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    // Focus the cancel button when dialog opens
    cancelButtonRef.current?.focus();

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onCancel}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        style={{
          background: "white",
          borderRadius: 12,
          padding: 24,
          maxWidth: 480,
          width: "90%",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
      >
        <h2
          id="dialog-title"
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 12,
            color: "var(--color-text)",
          }}
        >
          {title}
        </h2>
        
        <p
          id="dialog-description"
          style={{
            fontSize: 14,
            color: "var(--color-text-muted)",
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            className="swa-btn"
            style={{
              padding: "8px 16px",
              fontSize: 14,
              fontWeight: 600,
              border: "1px solid var(--color-border)",
              background: "white",
              color: "var(--color-text)",
              borderRadius: 6,
              cursor: "pointer",
            }}
            data-testid="confirm-dialog-cancel"
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            className="swa-btn swa-btn--primary"
            style={{
              padding: "8px 16px",
              fontSize: 14,
              fontWeight: 600,
              border: "none",
              background: variant === "danger" ? "#EF4444" : "var(--color-primary)",
              color: "white",
              borderRadius: 6,
              cursor: "pointer",
            }}
            data-testid="confirm-dialog-confirm"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
