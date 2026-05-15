import { requireAuth } from "@/middleware/auth";
import AdminSourcesClient from "./AdminSourcesClient";

export default async function AdminSourcesPage() {
  // Require authentication
  await requireAuth();
  
  return <AdminSourcesClient />;
}
