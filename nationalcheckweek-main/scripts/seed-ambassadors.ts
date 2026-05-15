import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const ambassadors = [
  {
    name: "Louise Rogers",
    title: "BSc/BE (Hons), MTeach (Primary) — School Can't Australia",
    bio: "Also a founding board member of School Can't Australia, Louise has volunteered for over 5 years as an administrator for the online community.",
    slug: "louise-rogers",
    sortOrder: 1,
  },
  {
    name: "Tiffany Westphal",
    title: "BSocWk, GradDMgt, BA — School Can't Australia",
    bio: "A founding board member of School Can't Australia, Tiffany has volunteered in the group for 5+ years. As a social worker, Tiffany supports families navigating school attendance challenges.",
    slug: "tiffany-westphal",
    sortOrder: 2,
  },
  {
    name: "Dr. Paula Barrett",
    title: "Director, Friends Resilience Pty Ltd — Author of the FRIENDS Programs",
    bio: "Doctor of Philosophy (UQ), Master of Clinical Psychology (UQ). Dr Paula Barrett is a clinician, scholar and researcher in the field of child and adolescent mental health.",
    slug: "dr-paula-barrett",
    sortOrder: 3,
  },
  {
    name: "Dr. Rachel Baffsky",
    title: "Postdoctoral Research Fellow — Black Dog Institute",
    bio: "Dr Baffsky is a Postdoctoral Research Fellow, funded by Suicide Prevention Australia, at the Black Dog Institute. Her research uses implementation science and co-design approaches to optimise youth mental health prevention in schools.",
    slug: "dr-rachel-baffsky",
    sortOrder: 4,
  },
  {
    name: "Dr. Lauren McGillivray",
    title: "Research Fellow & Clinical Psychologist — Black Dog Institute, UNSW",
    bio: "Dr McGillivray is a research fellow and clinical psychologist. After working in private and primary mental health care as a therapist, she joined Black Dog Institute, University of New South Wales.",
    slug: "dr-lauren-mcgillivray",
    sortOrder: 5,
  },
  {
    name: "Darryl Thompson",
    title: "Teacher & Principal — Department of Education, NSW",
    bio: "Darryl is a passionate advocate for public education. He has been a teacher and principal for almost 40 years with the Department of Education in western New South Wales.",
    slug: "darryl-thompson",
    sortOrder: 6,
  },
  {
    name: "Dr. Neil Hawkes",
    title: "D. Phil (Oxford), MEd, BA, FRSA — Values-based Education",
    bio: "Neil Hawkes is a doctoral graduate of Kellogg College, Oxford University. He is well known worldwide as an inspirational speaker, educator, broadcaster, author and social commentator.",
    slug: "dr-neil-hawkes",
    sortOrder: 7,
  },
  {
    name: "Gavin McCormack",
    title: "Montessori Educator & Co-founder, Upschool.co",
    bio: "Gavin McCormack is a Montessori educator, author, and co-founder of Upschool.co — a platform delivering free, purposeful education to children worldwide. Recognised globally for his work in education reform.",
    slug: "gavin-mccormack",
    sortOrder: 8,
  },
  {
    name: "Daniel Payne",
    title: "Assistant Principal — Shortland Public School",
    bio: "Daniel is involved in National Check-In Week because he is passionate about ensuring all students are known and supported in schools. Emotional literacy and self-regulation are vital.",
    slug: "daniel-payne",
    sortOrder: 9,
  },
  {
    name: "Dr Phil Lambert",
    title: "Education Expert — Former General Manager, ACARA",
    bio: "Dr Phil Lambert is an internationally acclaimed education expert. He has extensive experience in education as a principal, inspector, Regional Director (Sydney) and General Manager of the Australian Curriculum, Assessment and Reporting Authority.",
    slug: "dr-phil-lambert",
    sortOrder: 10,
  },
  {
    name: "Sarah Garnett",
    title: "Founder & CEO — The Footpath Library",
    bio: "Sarah Garnett has been working in the homelessness sector for more than 20 years as Founder and CEO of The Footpath Library, which operates Australia's only giving library for people experiencing homelessness.",
    slug: "sarah-garnett",
    sortOrder: 11,
  },
  {
    name: "Sally Webster",
    title: "Head of K12 Schools Industry, ANZ — Amazon Web Services",
    bio: "Sally has over 15 years' experience in the K-12 education sector. At Amazon Web Services (AWS), she leads schools industry strategy across Australia and New Zealand.",
    slug: "sally-webster",
    sortOrder: 12,
  },
];

async function seed() {
  console.log(`Seeding ${ambassadors.length} ambassadors...`);

  for (const a of ambassadors) {
    // Skip if slug already exists
    const { data: existing } = await sb
      .from("Ambassador")
      .select("id")
      .eq("slug", a.slug)
      .maybeSingle();

    if (existing) {
      console.log(`  ⏭  ${a.name} (already exists)`);
      continue;
    }

    const { error } = await sb.from("Ambassador").insert({
      name: a.name,
      title: a.title,
      bio: a.bio,
      slug: a.slug,
      sortOrder: a.sortOrder,
      active: true,
      photoUrl: null,
      linkedinUrl: null,
      websiteUrl: null,
      updatedAt: new Date().toISOString(),
    });

    if (error) {
      console.error(`  ✗  ${a.name}: ${error.message}`);
    } else {
      console.log(`  ✓  ${a.name}`);
    }
  }

  console.log("Done.");
}

seed();
