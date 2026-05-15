/**
 * Type definitions for About page CMS content
 * 
 * Defines the complete structure of the About page content stored in the CMS.
 * Shared across editor, renderer, and API to ensure type consistency.
 * 
 * All array items include stable IDs for React key props.
 * 
 * @module types/cms/about
 */

/**
 * Complete About page content structure
 * 
 * Contains all sections of the About page:
 * - Hero: Main title and subtitle
 * - Mission: Heading and two paragraphs
 * - Stats: Three statistics with sources
 * - Pillars: Three core pillars
 * - Beliefs: Heading and four belief items
 * - CTA: Call to action section
 */
export interface AboutPageContent {
  /** Hero section displayed at the top of the page */
  hero: {
    /** Main page title */
    title: string;
    /** Subtitle/tagline */
    subtitle: string;
  };
  /** Mission statement section */
  mission: {
    /** Section heading */
    heading: string;
    /** First paragraph of mission statement */
    paragraph1: string;
    /** Second paragraph of mission statement */
    paragraph2: string;
  };
  /** Array of statistics (exactly 3) */
  stats: Array<{
    /** Unique ID for React key */
    id: string;
    /** Statistic number/value (e.g., "1 in 5") */
    number: string;
    /** Description of the statistic */
    label: string;
    /** Source/citation for the statistic */
    source: string;
  }>;
  /** Concluding paragraph after statistics */
  statsConclusion: string;
  /** Array of core pillars (exactly 3) */
  pillars: Array<{
    /** Unique ID for React key */
    id: string;
    /** Emoji icon for the pillar */
    icon: string;
    /** Pillar title */
    title: string;
    /** Pillar description */
    body: string;
  }>;
  /** Beliefs section */
  beliefs: {
    /** Section heading */
    heading: string;
    /** Array of belief items (exactly 4) */
    items: Array<{
      /** Unique ID for React key */
      id: string;
      /** Emoji icon */
      icon: string;
      /** Belief statement */
      text: string;
    }>;
  };
  /** Call to action section */
  cta: {
    /** CTA heading */
    heading: string;
    /** CTA body text */
    text: string;
  };
}

/**
 * Validation constraints for About page fields
 * 
 * Defines maximum character lengths and required status for all fields.
 * Used by FormField components to enforce validation and show character counters.
 * 
 * @constant
 */
export const ABOUT_PAGE_CONSTRAINTS = {
  hero: {
    title: { maxLength: 200, required: true },
    subtitle: { maxLength: 500, required: true },
  },
  mission: {
    heading: { maxLength: 200, required: true },
    paragraph1: { maxLength: 1000, required: true },
    paragraph2: { maxLength: 1000, required: true },
  },
  stats: {
    number: { maxLength: 50, required: true },
    label: { maxLength: 200, required: true },
    source: { maxLength: 150, required: true },
  },
  statsConclusion: { maxLength: 500, required: true },
  pillars: {
    icon: { maxLength: 10, required: true },
    title: { maxLength: 100, required: true },
    body: { maxLength: 1000, required: true },
  },
  beliefs: {
    heading: { maxLength: 200, required: true },
    items: {
      icon: { maxLength: 10, required: true },
      text: { maxLength: 300, required: true },
    },
  },
  cta: {
    heading: { maxLength: 200, required: true },
    text: { maxLength: 500, required: true },
  },
} as const;
