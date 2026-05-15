"use client";

export default function RegenBtn({ label, onClick, busy }: { label: string; onClick: () => void; busy: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="admin-btn admin-btn-secondary text-xs flex items-center gap-1.5"
      style={{ opacity: busy ? 0.6 : 1 }}
      title={`Re-generate ${label} with AI`}
    >
      {busy
        ? <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
        : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.01"/></svg>
      }
      {busy ? "Generating…" : `↺ ${label}`}
    </button>
  );
}
