import { createClient } from "@supabase/supabase-js";
import EventsClient from "@/components/events/EventsClient";
import type { EventListItem } from "@/lib/events";

export const metadata = {
  title: "Events — National Check-in Week",
  description:
    "Join expert-led webinars, workshops, and conferences on student wellbeing, emotional literacy, and data-driven school improvement.",
};

export const revalidate = 60;

export default async function EventsPage() {
  let events: EventListItem[] = [];

  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await sb
      .from("events")
      .select("id,slug,title,tagline,event_date,event_time,event_end,format,feature_image,status,is_free,price,register_url")
      .eq("published", true)
      .order("event_date", { ascending: true });
    events = (data ?? []) as EventListItem[];
  } catch {
    // render empty state gracefully
  }

  return (
    <>
      <div className="page-hero page-hero--centered">
        <div className="page-hero__inner" style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <div className="section-tag" style={{ margin: "0 auto 16px" }}>
            Webinars · Workshops · Conferences
          </div>
          <h1 className="page-hero__title" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>
            Events
          </h1>
          <p className="page-hero__subtitle" style={{ margin: "0 auto" }}>
            Join our expert-led events on student wellbeing, emotional literacy, and data-driven school improvement.
            Live webinars, workshops, and conferences designed for educators and school leaders.
          </p>
        </div>
      </div>

      <main id="main-content" className="inner-content inner-content--wide">
        <EventsClient events={events} />
      </main>
    </>
  );
}
