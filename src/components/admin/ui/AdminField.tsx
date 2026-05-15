/**
 * AdminField — wraps a label, input/select/textarea, optional hint, and
 * optional per-field error message into a single composable unit.
 *
 * Usage:
 *   <AdminField id="user-email" label="Email" error={fieldErrors.email} hint="Must be unique">
 *     <input id="user-email" ... />
 *   </AdminField>
 */
import React from "react";
import { LABEL_CLS, LABEL_STYLE } from "./adminStyles";
import { FieldErrorMessage } from "./FieldErrorMessage";

interface AdminFieldProps {
  /** Must match the `id` on the child input for label association. */
  id: string;
  label: React.ReactNode;
  /** If set, renders a red per-field error below the input. */
  error?: string;
  /** If set and no error is present, renders a faint hint below the input. */
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

export function AdminField({
  id,
  label,
  error,
  hint,
  className,
  children,
}: AdminFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className={LABEL_CLS} style={LABEL_STYLE}>
        {label}
      </label>
      {children}
      {error ? (
        <FieldErrorMessage message={error} />
      ) : hint ? (
        <div className="text-xs mt-1.5" style={{ color: "var(--admin-text-faint)" }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}
