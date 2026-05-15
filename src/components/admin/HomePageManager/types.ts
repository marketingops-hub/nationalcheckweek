export type Tab = "hero" | "logos" | "cta" | "footer";

export interface HeroSettings {
  logo_url?: string;
  logo_height?: number;
  event_date?: string;
  event_location?: string;
  event_emoji?: string;
  heading_line1?: string;
  heading_line2?: string;
  subheading?: string;
  primary_cta_text?: string;
  primary_cta_link?: string;
  secondary_cta_text?: string;
  secondary_cta_link?: string;
  hero_image_url?: string;
  countdown_target_date?: string;
  countdown_label?: string;
  show_countdown?: boolean;
  stats_value?: string;
  stats_label?: string;
  show_stats_card?: boolean;
  badge_text?: string;
  show_badge?: boolean;
  background_color?: string;
  heading_color?: string;
  subheading_color?: string;
  primary_button_bg?: string;
  primary_button_text?: string;
  secondary_button_bg?: string;
  secondary_button_text?: string;
}

export interface Logo {
  id: string;
  name: string;
  logo_url?: string;
  link_url?: string;
  display_order: number;
  is_active: boolean;
}

export interface CTASettings {
  eyebrow_text?: string;
  heading_text?: string;
  description_text?: string;
  primary_cta_text?: string;
  primary_cta_link?: string;
  secondary_cta_text?: string;
  secondary_cta_link?: string;
  background_color?: string;
  text_color?: string;
  eyebrow_color?: string;
  primary_button_bg?: string;
  primary_button_text?: string;
  secondary_button_bg?: string;
  secondary_button_text?: string;
}

export interface FooterSettings {
  logo_url?: string;
  brand_description?: string;
  contact_phone?: string;
  contact_fax?: string;
  contact_email?: string;
  copyright_text?: string;
  background_color?: string;
  text_color?: string;
  heading_color?: string;
  link_color?: string;
  link_hover_color?: string;
}
