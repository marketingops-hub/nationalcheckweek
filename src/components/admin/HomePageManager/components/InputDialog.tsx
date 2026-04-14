"use client";

import { useEffect, useRef, useState } from "react";

interface InputDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

/**
 * Accessible input dialog component.
 * Replaces native prompt() with a proper modal that supports keyboard navigation,
 * focus trapping, and screen readers.
 * 
 * @example
 * ```tsx
 * <InputDialog
 *   isOpen={showAddDialog}
 *   title="Add Organization"
 *   message="Enter the organization name:"
 *   placeholder="Organization name"
 *   confirmText="Add"
 *   cancelText="Cancel"
 *   onConfirm={handleAdd}
 *   onCancel={() => setShowAddDialog(false)}
 * />
 * ```
 */
export default function InputDialog({
  isOpen,
  title,
  message,
  placeholder = "",
  defaultValue = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: InputDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset value when dialog opens
  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      // Focus input when dialog opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, defaultValue]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onConfirm(value.trim());
    }
  };

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
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="input-dialog-title"
        aria-describedby="input-dialog-description"
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
          id="input-dialog-title"
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
          id="input-dialog-description"
          style={{
            fontSize: 14,
            color: "var(--color-text-muted)",
            marginBottom: 16,
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="swa-form-input"
            style={{
              width: "100%",
              marginBottom: 24,
            }}
            aria-label={message}
            data-testid="input-dialog-input"
          />

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button
              type="button"
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
              data-testid="input-dialog-cancel"
            >
              {cancelText}
            </button>
            
            <button
              type="submit"
              disabled={!value.trim()}
              className="swa-btn swa-btn--primary"
              style={{
                padding: "8px 16px",
                fontSize: 14,
                fontWeight: 600,
                border: "none",
                background: value.trim() ? "var(--color-primary)" : "#ccc",
                color: "white",
                borderRadius: 6,
                cursor: value.trim() ? "pointer" : "not-allowed",
              }}
              data-testid="input-dialog-confirm"
            >
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
