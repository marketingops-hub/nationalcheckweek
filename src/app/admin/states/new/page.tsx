import StateEditForm from "@/components/admin/StateEditForm";

export default function NewStatePage() {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--admin-accent)" }}>States</span>
          <span style={{ color: "var(--admin-border-strong)" }}>/</span>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--admin-text-subtle)" }}>New</span>
        </div>
        <h1 className="text-xl font-bold" style={{ color: "var(--admin-text-primary)", letterSpacing: "-0.025em" }}>Create State</h1>
      </div>
      <StateEditForm state={null} />
    </div>
  );
}
