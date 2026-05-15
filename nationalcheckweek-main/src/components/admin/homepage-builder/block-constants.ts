import type { ComponentType } from "react";
import type { BlockType, BlockContent } from "@/types/homepage-blocks";
import {
  HeroBlockEditor,
  StatsBlockEditor,
  CTABlockEditor,
  WelcomeBlockEditor,
  WhatIsItBlockEditor,
  WhyMattersBlockEditor,
  WhatMakesDifferentBlockEditor,
  WhatAndWhoBlockEditor,
  BePartCTABlockEditor,
  HowToParticipateBlockEditor,
  AmbassadorsBlockEditor,
  HowLifeSkillsGOBlockEditor,
  AmbassadorVoicesBlockEditor,
  PartnersSlideshowBlockEditor,
  IfNotNowWhenBlockEditor,
  YourVoiceBlockEditor,
} from "./block-editors";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Single source of truth for all supported homepage block types. */
export const HOMEPAGE_BLOCK_DEFS: Array<{ type: BlockType; label: string; defaultContent: BlockContent }> = [
  { type: "hero",                 label: "Hero",                  defaultContent: { heading: "New Hero Section", subheading: "", primaryCTA: { text: "Get Started", link: "/" }, secondaryCTA: { text: "", link: "" }, backgroundImage: "" } },
  { type: "stats",                label: "Stats",                 defaultContent: { stats: [{ value: "0", label: "Label" }] } },
  { type: "cta",                  label: "CTA",                   defaultContent: { eyebrow: "", heading: "Take Action", description: "", primaryCTA: { text: "Learn More", link: "/" }, secondaryCTA: { text: "", link: "" }, backgroundColor: "#6366f1", textColor: "#ffffff" } },
  { type: "welcome",              label: "Welcome",               defaultContent: { eyebrow: "", heading: "Welcome", description: "", longDescription: "" } },
  { type: "what_is_it",           label: "What Is It",            defaultContent: { vimeoUrl: "", heading: "What Is It?", description: "", ctaText: "Learn More", ctaLink: "/" } },
  { type: "why_matters",          label: "Why It Matters",        defaultContent: { heading: "Why It Matters", subheading: "", cards: [{ icon: "star", title: "Reason 1", description: "" }] } },
  { type: "what_makes_different", label: "What Makes Us Different",defaultContent: { heading: "What Makes Us Different", paragraphs: [""] } },
  { type: "what_and_who",         label: "What & Who",            defaultContent: { column1Heading: "What", column1Description: "", column1Tags: [], column2Heading: "Who", column2Items: [], ctaQuote: "" } },
  { type: "be_part_cta",          label: "Be Part CTA",           defaultContent: { heading: "Be Part Of It", subheading: "", description: "", ctaText: "Join Now", ctaLink: "/" } },
  { type: "how_to_participate",   label: "How To Participate",    defaultContent: { heading: "How To Participate", description: "", features: [] } },
  { type: "ambassadors",          label: "Ambassadors",           defaultContent: { heading: "Our Ambassadors", description: "", ambassadors: [] } },
  { type: "how_lifeskills_go",    label: "How LifeSkills GO",     defaultContent: { heading: "How Life Skills GO Powers This", paragraphs: [""], image: "" } },
  { type: "ambassador_voices",    label: "Ambassador Voices",     defaultContent: { heading: "Ambassador Voices", description: "", buttonText: "Watch Stories" } },
  { type: "partners_slideshow",   label: "Partners Slideshow",    defaultContent: { heading: "Our Partners" } },
  { type: "if_not_now_when",      label: "If Not Now When",       defaultContent: { sectionTitle: "", heading: "If Not Now, When?", description: "", subheading: "", checklistItems: [] } },
  { type: "your_voice",           label: "Your Voice",            defaultContent: { eyebrow: "We Need Your Help", heading: "Let Your Voice Be Heard", description: "At National Check Week, we need your opinion to help us find the best solution. Join the conversation and make a difference in student wellbeing across Australia.", ctaText: "Join the Conversation", ctaLink: "/your-voice" } },
];

/** Derived lookups — built once from HOMEPAGE_BLOCK_DEFS */
export const SUPPORTED_BLOCK_TYPES = new Set<BlockType>(HOMEPAGE_BLOCK_DEFS.map(d => d.type));
export const BLOCK_DEF_BY_TYPE = new Map(HOMEPAGE_BLOCK_DEFS.map(d => [d.type, d]));

/**
 * Icon mapping for different block types
 */
export const BLOCK_ICONS: Record<BlockType, string> = {
  hero: "home",
  stats: "bar_chart",
  features: "grid_view",
  logos: "business",
  cta: "campaign",
  testimonials: "format_quote",
  faq: "help",
  contact: "contact_mail",
  welcome: "waving_hand",
  what_is_it: "play_circle",
  why_matters: "priority_high",
  what_makes_different: "stars",
  what_and_who: "groups",
  be_part_cta: "campaign",
  how_to_participate: "how_to_reg",
  ambassadors: "workspace_premium",
  how_lifeskills_go: "psychology",
  ambassador_voices: "record_voice_over",
  partners_slideshow: "handshake",
  if_not_now_when: "schedule",
  your_voice: "voice_selection",
  schools_navigating_data: "school",
  wellbeing_across_australia: "map",
};

/**
 * Editor component registry — maps block_type to its inline editor.
 * To add a new editor: add one line here + create the editor component.
 */
export const EDITOR_REGISTRY: Partial<Record<BlockType, ComponentType<{ content: any; onChange: (key: string, value: unknown) => void }>>> = {
  hero:                 HeroBlockEditor,
  stats:                StatsBlockEditor,
  cta:                  CTABlockEditor,
  welcome:              WelcomeBlockEditor,
  what_is_it:           WhatIsItBlockEditor,
  why_matters:          WhyMattersBlockEditor,
  what_makes_different: WhatMakesDifferentBlockEditor,
  what_and_who:         WhatAndWhoBlockEditor,
  be_part_cta:          BePartCTABlockEditor,
  how_to_participate:   HowToParticipateBlockEditor,
  ambassadors:          AmbassadorsBlockEditor,
  how_lifeskills_go:    HowLifeSkillsGOBlockEditor,
  ambassador_voices:    AmbassadorVoicesBlockEditor,
  partners_slideshow:   PartnersSlideshowBlockEditor,
  if_not_now_when:      IfNotNowWhenBlockEditor,
  your_voice:           YourVoiceBlockEditor,
};
