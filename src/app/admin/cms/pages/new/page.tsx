import PageEditor from "@/components/admin/PageEditor";

export default function NewPagePage() {
  return (
    <div>
      <div className="admin-page-header">
        <h1>Create Page</h1>
      </div>
      <PageEditor page={null} />
    </div>
  );
}
