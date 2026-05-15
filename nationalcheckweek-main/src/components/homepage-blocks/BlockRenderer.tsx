'use client';

import { type ComponentType } from 'react';
import dynamic from 'next/dynamic';
import type { BlockType, BlockContent } from '@/types/homepage-blocks';

// HeroBlock is above-the-fold — keep it in the initial bundle for fastest LCP
import HeroBlock from './HeroBlock';

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyBlockComponent = ComponentType<any>;

/**
 * Registry mapping block_type → lazy-loaded component.
 * To add a new block: add one line here + create the component file.
 */
const BLOCK_REGISTRY: Partial<Record<BlockType, AnyBlockComponent>> = {
  hero:                       HeroBlock,
  stats:                      dynamic(() => import('./StatsBlock')),
  features:                   dynamic(() => import('./FeaturesBlock')),
  logos:                      dynamic(() => import('./LogosBlock')),
  cta:                        dynamic(() => import('./CTABlock')),
  testimonials:               dynamic(() => import('./TestimonialsBlock')),
  schools_navigating_data:    dynamic(() => import('./SchoolsNavigatingDataBlock')),
  wellbeing_across_australia: dynamic(() => import('./WellbeingAcrossAustraliaBlock')),
  welcome:                    dynamic(() => import('./WelcomeBlock')),
  what_is_it:                 dynamic(() => import('./WhatIsItBlock')),
  why_matters:                dynamic(() => import('./WhyMattersBlock')),
  what_makes_different:       dynamic(() => import('./WhatMakesDifferentBlock')),
  what_and_who:               dynamic(() => import('./WhatAndWhoBlock')),
  be_part_cta:                dynamic(() => import('./BePartCTABlock')),
  how_to_participate:         dynamic(() => import('./HowToParticipateBlock')),
  ambassadors:                dynamic(() => import('./AmbassadorsBlock')),
  how_lifeskills_go:          dynamic(() => import('./HowLifeSkillsGOBlock')),
  ambassador_voices:          dynamic(() => import('./AmbassadorVoicesBlock')),
  partners_slideshow:         dynamic(() => import('./PartnersSlideshowBlock')),
  if_not_now_when:            dynamic(() => import('./IfNotNowWhenBlock')),
  your_voice:                 dynamic(() => import('./YourVoiceBlock')),
};

/** Block types that receive globalColors instead of accentColor */
const GLOBAL_COLOR_BLOCKS = new Set<BlockType>(['hero', 'cta']);

/** Block types that receive extra data props */
const EXTRA_PROPS: Partial<Record<BlockType, string>> = {
  ambassador_voices:  'initialAmbassadors',
  partners_slideshow: 'initialPartners',
};

interface HomepageBlock {
  id: string;
  block_type: BlockType;
  title: string;
  content: BlockContent;
  display_order: number;
  is_visible: boolean;
}

interface GlobalColors {
  primaryButton: string;
  primaryButtonText: string;
  secondaryButton: string;
  secondaryButtonText: string;
  heading: string;
  subheading: string;
  ctaBackground: string;
  ctaText: string;
  ctaPrimaryButton: string;
}

interface BlockRendererProps {
  blocks: HomepageBlock[];
  globalColors: GlobalColors;
  partners?: Record<string, unknown>[];
  ambassadors?: Record<string, unknown>[];
}

export default function BlockRenderer({ blocks, globalColors, partners, ambassadors }: BlockRendererProps) {
  if (!blocks || blocks.length === 0) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <p style={{ color: '#7b78a0', fontSize: '1.125rem' }}>
          No content blocks available. Please add blocks from the admin panel.
        </p>
      </div>
    );
  }

  const extraData: Record<string, Record<string, unknown>[] | undefined> = {
    initialAmbassadors: ambassadors,
    initialPartners: partners,
  };

  return (
    <>
      {blocks.map((block) => {
        const Component = BLOCK_REGISTRY[block.block_type];
        if (!Component) {
          console.warn(`Unknown block type: ${block.block_type}`);
          return null;
        }

        const props: Record<string, unknown> = { content: block.content };

        if (GLOBAL_COLOR_BLOCKS.has(block.block_type)) {
          props.globalColors = globalColors;
        } else {
          props.accentColor = globalColors.primaryButton;
        }

        const extraPropKey = EXTRA_PROPS[block.block_type];
        if (extraPropKey) {
          props[extraPropKey] = extraData[extraPropKey];
        }

        return <Component key={block.id} {...props} />;
      })}
    </>
  );
}
