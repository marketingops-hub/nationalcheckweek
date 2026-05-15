import AreaEditForm from "@/components/admin/AreaEditForm";

export default function NewAreaPage() {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--admin-accent)" }}>Areas</span>
          <span style={{ color: "var(--admin-border-strong)" }}>/</span>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--admin-text-subtle)" }}>New</span>
        </div>
        <h1 className="text-xl font-bold" style={{ color: "var(--admin-text-primary)", letterSpacing: "-0.025em" }}>Create Area</h1>
      </div>
      <AreaEditForm area={null} />
    </div>
  );
}
