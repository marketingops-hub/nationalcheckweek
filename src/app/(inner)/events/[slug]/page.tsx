import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as staticClient } from "@supabase/supabase-js";
import EventPageClient from "@/components/events/EventPageClient";
import type { EventRecord } from "@/lib/events";

export const revalidate = 60;

export async function generateStaticParams() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return [];
  const sb = staticClient(url, anon);
  const { data } = await sb.from("events").select("slug").eq("published", true);
  return (data ?? []).map((e: { slug: string }) => ({ slug: e.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return {};
  const sb = staticClient(url, anon);
  const { data } = await sb
    .from("events")
    .select("title,tagline,seo_title,seo_desc,feature_image")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!data) return {};

  const title = (data.seo_title && data.seo_title.trim() !== '') ? data.seo_title : data.title;
  const description = (data.seo_desc && data.seo_desc.trim() !== '') ? data.seo_desc : data.tagline;

  return {
    title: `${title} — National Check-in Week`,
    description,
    openGraph: {
      title,
      description,
      images: (data.feature_image && data.feature_image.trim() !== '') ? [{ url: data.feature_image }] : [],
    },
  };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const sb = await createClient();

    const { data, error } = await sb
      .from("events")
      .select("*, event_speakers(*)") 
      .eq("slug", slug)
      .single();

    if (error) {
      console.error('[EventPage] Supabase error for slug:', slug, error);
      notFound();
    }

    if (!data) {
      console.error('[EventPage] No event found for slug:', slug);
      notFound();
    }

    // Check if published
    if (!data.published) {
      console.warn('[EventPage] Event exists but is not published:', slug);
      notFound();
    }
    
    console.log('[EventPage] Event data loaded successfully:', { slug, title: data.title, format: data.format, status: data.status });
    const event = data as EventRecord;

    // Ensure all required fields have defaults
    const speakers = Array.isArray(event.event_speakers) 
      ? [...event.event_speakers].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      : [];

    return <EventPageClient event={event} speakers={speakers} />;
  } catch (error: any) {
    console.error('[EventPage] Rendering error for slug:', await params.then(p => p.slug), error);
    console.error('[EventPage] Error stack:', error.stack);
    throw error;
  }
}
