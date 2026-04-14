/**
 * Homepage Blocks Type Definitions
 * 
 * Defines strict TypeScript interfaces for all homepage block types
 * to ensure type safety and prevent runtime errors.
 */

/**
 * Base interface for all homepage blocks
 */
export interface HomepageBlock {
  id: string;
  block_type: BlockType;
  title: string;
  content: BlockContent;
  display_order: number;
  is_visible: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Supported block types
 */
export type BlockType = 'hero' | 'stats' | 'features' | 'logos' | 'cta' | 'testimonials' | 'faq' | 'contact' | 'welcome' | 'what_is_it' | 'why_matters' | 'what_makes_different' | 'what_and_who' | 'be_part_cta' | 'how_to_participate' | 'ambassadors' | 'how_lifeskills_go' | 'ambassador_voices' | 'partners_slideshow' | 'if_not_now_when' | 'your_voice';

/**
 * Union type for all block content types
 */
export type BlockContent = 
  | HeroBlockContent 
  | StatsBlockContent 
  | FeaturesBlockContent 
  | LogosBlockContent 
  | CTABlockContent 
  | TestimonialsBlockContent
  | WelcomeBlockContent
  | WhatIsItBlockContent
  | WhyMattersBlockContent
  | WhatMakesDifferentBlockContent
  | WhatAndWhoBlockContent
  | BePartCTABlockContent
  | HowToParticipateBlockContent
  | AmbassadorsBlockContent
  | HowLifeSkillsGOBlockContent
  | AmbassadorVoicesBlockContent
  | PartnersSlideshowBlockContent
  | IfNotNowWhenBlockContent
  | YourVoiceBlockContent;

/**
 * Color override configuration for blocks
 */
export interface BlockColors {
  useGlobalColors?: boolean;
  primaryButton?: string;
  primaryButtonText?: string;
  secondaryButton?: string;
  secondaryButtonText?: string;
  heading?: string;
  subheading?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  ctaBackground?: string;
  ctaText?: string;
  ctaPrimaryButton?: string;
}

/**
 * Hero block content structure
 */
export interface HeroBlockContent {
  heading: string;
  subheading: string;
  primaryCTA: {
    text: string;
    link: string;
  };
  secondaryCTA: {
    text: string;
    link: string;
  };
  backgroundImage: string;
  badge?: {
    emoji: string;
    text: string;
  };
  colors?: BlockColors;
}

/**
 * Stats block content structure
 */
export interface StatsBlockContent {
  stats: Array<{
    value: string;
    label: string;
  }>;
  colors?: BlockColors;
}

/**
 * Features block content structure
 */
export interface FeaturesBlockContent {
  heading: string;
  features: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  colors?: BlockColors;
}

/**
 * Logos block content structure
 */
export interface LogosBlockContent {
  heading: string;
  logos: Array<{
    name: string;
    url: string;
  }>;
  colors?: BlockColors;
}

/**
 * CTA block content structure
 */
export interface CTABlockContent {
  eyebrow: string;
  heading: string;
  description: string;
  primaryCTA: {
    text: string;
    link: string;
  };
  secondaryCTA: {
    text: string;
    link: string;
  };
  backgroundColor: string;
  textColor: string;
  colors?: BlockColors;
}

/**
 * Testimonials block content structure
 */
export interface TestimonialsBlockContent {
  heading: string;
  testimonials: Array<{
    quote: string;
    author: string;
    role: string;
    avatar: string;
  }>;
  colors?: BlockColors;
}

/**
 * Welcome block content structure
 */
export interface WelcomeBlockContent {
  eyebrow: string;
  heading: string;
  description: string;
  longDescription: string;
  colors?: BlockColors;
}

/**
 * What Is It block content structure (2 columns: video + text)
 */
export interface WhatIsItBlockContent {
  vimeoUrl: string;
  heading: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  colors?: BlockColors;
}

/**
 * Why Matters block content structure (4 cards in grid)
 */
export interface WhyMattersBlockContent {
  heading: string;
  subheading: string;
  cards: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  colors?: BlockColors;
}

/**
 * What Makes Different block content structure
 */
export interface WhatMakesDifferentBlockContent {
  heading: string;
  paragraphs: string[];
  colors?: BlockColors;
}

/**
 * What And Who block content structure (2 columns + CTA)
 */
export interface WhatAndWhoBlockContent {
  column1Heading: string;
  column1Description: string;
  column1Tags: string[];
  column2Heading: string;
  column2Items: string[];
  ctaQuote: string;
  colors?: BlockColors;
}

/**
 * Be Part CTA block content structure
 */
export interface BePartCTABlockContent {
  heading: string;
  subheading: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  colors?: BlockColors;
}

/**
 * How To Participate block content structure (2 columns: text + HubSpot form)
 */
export interface HowToParticipateBlockContent {
  heading: string;
  description: string;
  features: string[];
  formHeading?: string;
  hubspotPortalId?: string;
  hubspotFormId?: string;
  hubspotRegion?: string;
  backgroundColor?: string;
  colors?: BlockColors;
}

/**
 * Ambassadors block content structure
 */
export interface AmbassadorsBlockContent {
  heading: string;
  description: string;
  ambassadors: Array<{
    name: string;
    title: string;
    image: string;
    bio?: string;
  }>;
  colors?: BlockColors;
}

/**
 * How Life Skills GO Powers NCIW block content structure (2 columns: text + image)
 */
export interface HowLifeSkillsGOBlockContent {
  heading: string;
  paragraphs: string[];
  image: string;
  colors?: BlockColors;
}

/**
 * If Not Now When block content structure
 */
export interface IfNotNowWhenBlockContent {
  sectionTitle: string;
  heading: string;
  description: string;
  boldNote?: string;
  subheading: string;
  subDescription?: string;
  checklistItems: string[];
  backgroundColor?: string;
  colors?: BlockColors;
}

/**
 * Partners Slideshow block content structure
 */
export interface PartnersSlideshowBlockContent {
  heading?: string;
  colors?: BlockColors;
}

/**
 * Ambassador Voices block content structure
 */
export interface AmbassadorVoicesBlockContent {
  heading?: string;
  description?: string;
  buttonText?: string;
  buttonColor?: string;
  colors?: BlockColors;
}

/**
 * Your Voice block content structure (CTA block linking to /your-voice)
 */
export interface YourVoiceBlockContent {
  eyebrow?: string;
  heading?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  colors?: BlockColors;
}

/**
 * API request/response types
 */
export interface GetBlocksResponse {
  blocks: HomepageBlock[];
}

export interface CreateBlockRequest {
  block_type: BlockType;
  title: string;
  content: BlockContent;
  is_visible?: boolean;
}

export interface UpdateBlockRequest {
  title?: string;
  content?: BlockContent;
  display_order?: number;
  is_visible?: boolean;
}

export interface BulkUpdateOrderRequest {
  blocks: Array<{
    id: string;
    display_order: number;
  }>;
}
