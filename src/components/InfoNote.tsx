import type { ReactNode } from "react";

interface InfoNoteProps {
  children: ReactNode;
  /** Emoji or icon shown to the left of the note. Defaults to 💡 */
  icon?: ReactNode;
  /** Tightens vertical spacing (adds the info-note--snug modifier). */
  snug?: boolean;
}

/**
 * Highlighted callout used across geo and issue templates.
 * Replaces the previously duplicated `.info-note` markup in
 * states/[slug] and issues/[slug].
 */
export default function InfoNote({ children, icon = "💡", snug = false }: InfoNoteProps) {
  return (
    <div className={`info-note${snug ? " info-note--snug" : ""}`}>
      <div className="info-note__inner">
        <span className="info-note__icon">{icon}</span>
        <div>{children}</div>
      </div>
    </div>
  );
}
