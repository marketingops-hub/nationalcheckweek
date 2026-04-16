import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/adminClient";
import { requireAdmin } from "@/lib/auth";

const YOUR_VOICE_KEYS = [
  "your_voice_badge_text",
  "your_voice_badge_emoji",
  "your_voice_hero_icon",
  "your_voice_hero_title",
  "your_voice_hero_subtitle",
  "your_voice_intro_paragraph_1",
  "your_voice_intro_paragraph_2",
  "your_voice_form_id",
  "your_voice_portal_id",
  "your_voice_region",
];

const DEFAULTS: Record<string, string> = {
  your_voice_badge_text: 'Have Your Say',
  your_voice_badge_emoji: '🎤',
  your_voice_hero_icon: '🗣️',
  your_voice_hero_title: 'Your voice matters',
  your_voice_hero_subtitle: 'We are inviting educators, parents and carers to share what they are seeing in the lives of children and young people today.',
  your_voice_intro_paragraph_1: 'Your perspective is valuable. Your insight is important. What you share can help shape a stronger response for young people across Australia.',
  your_voice_intro_paragraph_2: 'The conversation below takes just a few minutes and your responses are completely confidential. Every submission is reviewed by our team and contributes directly to the evidence base behind National Check-in Week.',
  your_voice_form_id: '2o-7kx1iFS1a1MP8QeaF-Gg',
  your_voice_portal_id: '4596264',
  your_voice_region: 'ap1',
};

export const GET = async () => {
  const sb = adminClient();
  const { data, error } = await sb
    .from("site_settings")
    .select("key, value")
    .in("key", YOUR_VOICE_KEYS);
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  const map: Record<string, string> = { ...DEFAULTS };
  (data ?? []).forEach((r: { key: string; value: string }) => { 
    map[r.key] = r.value; 
  });
  
  // Convert from database keys to API keys
  const result = {
    badge_text: map.your_voice_badge_text,
    badge_emoji: map.your_voice_badge_emoji,
    hero_icon: map.your_voice_hero_icon,
    hero_title: map.your_voice_hero_title,
    hero_subtitle: map.your_voice_hero_subtitle,
    intro_paragraph_1: map.your_voice_intro_paragraph_1,
    intro_paragraph_2: map.your_voice_intro_paragraph_2,
    form_id: map.your_voice_form_id,
    portal_id: map.your_voice_portal_id,
    region: map.your_voice_region,
  };
  
  return NextResponse.json(result);
};

export const PATCH = requireAdmin(async (req: NextRequest) => {

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const MAX_LENGTHS: Record<string, number> = {
    badge_text: 50,
    badge_emoji: 10,
    hero_icon: 10,
    hero_title: 100,
    hero_subtitle: 300,
    intro_paragraph_1: 1000,
    intro_paragraph_2: 1000,
    form_id: 200,
    portal_id: 50,
    region: 10,
  };

  for (const [field, max] of Object.entries(MAX_LENGTHS)) {
    if (field in body && typeof body[field] === "string" && (body[field] as string).length > max) {
      return NextResponse.json({ error: `${field} must be ${max} characters or fewer` }, { status: 400 });
    }
  }

  const sb = adminClient();
  const fields = [
    'badge_text',
    'badge_emoji',
    'hero_icon',
    'hero_title',
    'hero_subtitle',
    'intro_paragraph_1',
    'intro_paragraph_2',
    'form_id',
    'portal_id',
    'region',
  ] as const;

  for (const field of fields) {
    if (field in body) {
      const { error } = await sb.from("site_settings").upsert({
        key: `your_voice_${field}`,
        value: String(body[field]),
        updated_at: new Date().toISOString(),
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  revalidatePath("/your-voice", "page");
  return NextResponse.json({ ok: true });
});
