import PageEditor from "@/components/admin/PageEditor";

export default function NewPagePage() {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#58A6FF" }}>CMS / Pages</span>
          <span style={{ color: "#30363D" }}>/</span>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6E7681" }}>New</span>
        </div>
        <h1 className="text-xl font-semibold" style={{ color: "#E6EDF3" }}>Create Page</h1>
      </div>
      <PageEditor page={null} />
    </div>
  );
}
