/**
 * FieldErrorMessage — small inline error shown below a form input.
 * Includes an accessible alert icon and role="alert" for screen readers.
 */
import React from "react";

interface FieldErrorMessageProps {
  message: string;
}

/** Reusable inline SVG warning circle — kept here to avoid duplication across forms. */
function WarnIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function FieldErrorMessage({ message }: FieldErrorMessageProps) {
  if (!message) return null;
  return (
    <p className="admin-field-error" role="alert">
      <WarnIcon />
      {message}
    </p>
  );
}
