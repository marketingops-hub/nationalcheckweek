/**
 * DangerConfirm — inline row that replaces browser confirm() for destructive actions.
 * Renders a message, a "Yes, delete" button, and a "Cancel" button side by side.
 *
 * Usage (inside a table <td>):
 *   {confirmId === row.id ? (
 *     <DangerConfirm
 *       message={<>Delete <strong>{row.name}</strong>?</>}
 *       onConfirm={() => handleDelete(row)}
 *       onCancel={() => setConfirmId(null)}
 *       busy={busy}
 *       confirmLabel="Yes, delete"
 *     />
 *   ) : (
 *     <button onClick={() => setConfirmId(row.id)}>Delete</button>
 *   )}
 */
import React from "react";

interface DangerConfirmProps {
  /** The confirmation message to display. Can include JSX (e.g. <strong>). */
  message: React.ReactNode;
  /** Called when the user clicks the confirm button. */
  onConfirm: () => void;
  /** Called when the user clicks Cancel. */
  onCancel: () => void;
  /** When true, the confirm button shows a loading state and is disabled. */
  busy?: boolean;
  /** Label for the confirm button. Defaults to "Yes, delete". */
  confirmLabel?: string;
  /** Label shown while busy. Defaults to "Deleting…". */
  busyLabel?: string;
}

export function DangerConfirm({
  message,
  onConfirm,
  onCancel,
  busy = false,
  confirmLabel = "Yes, delete",
  busyLabel = "Deleting…",
}: DangerConfirmProps) {
  return (
    <div className="admin-danger-confirm">
      <span>{message}</span>
      <button
        onClick={onConfirm}
        disabled={busy}
        className="admin-btn admin-btn-danger"
        style={{ padding: "4px 10px", fontSize: "0.75rem", opacity: busy ? 0.6 : 1 }}
      >
        {busy ? busyLabel : confirmLabel}
      </button>
      <button
        onClick={onCancel}
        className="admin-btn admin-btn-secondary"
        style={{ padding: "4px 10px", fontSize: "0.75rem" }}
      >
        Cancel
      </button>
    </div>
  );
}
