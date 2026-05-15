/**
 * FormPanelHeader — standard header used at the top of every inline admin form panel.
 * Renders a title, optional subtitle, and a close (×) button on the right.
 *
 * Usage:
 *   <FormPanelHeader
 *     title="Create New User"
 *     subtitle="The new user will be able to sign in immediately."
 *     onClose={() => setShowCreate(false)}
 *     closeLabel="Close create user form"
 *   />
 */
import React from "react";

interface FormPanelHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Called when the × button is clicked. */
  onClose: () => void;
  /** aria-label for the close button. Defaults to "Close". */
  closeLabel?: string;
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function FormPanelHeader({
  title,
  subtitle,
  onClose,
  closeLabel = "Close",
}: FormPanelHeaderProps) {
  return (
    <div
      className="flex items-center justify-between mb-6 pb-4"
      style={{ borderBottom: "1px solid var(--admin-border)" }}
    >
      <div>
        <h2 style={{ color: "var(--admin-text-primary)", margin: 0, border: "none", padding: 0 }}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm mt-1" style={{ color: "var(--admin-text-subtle)" }}>
            {subtitle}
          </p>
        )}
      </div>
      <button onClick={onClose} className="admin-icon-btn" aria-label={closeLabel}>
        <CloseIcon />
      </button>
    </div>
  );
}
