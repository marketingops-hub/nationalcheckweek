import Link from "next/link";
import EventEditForm from "@/components/admin/EventEditForm";

export default function NewEventPage() {
  return (
    <div>
      <div className="swa-page-header">
        <div>
          <div style={{ fontSize: "0.78rem", color: "#9CA3AF", marginBottom: 4 }}>
            <Link href="/admin/events" style={{ color: "#7C3AED", fontWeight: 600 }}>Events</Link>
            {" / "}New
          </div>
          <h1 className="swa-page-title">Create Event</h1>
        </div>
      </div>
      <EventEditForm />
    </div>
  );
}
