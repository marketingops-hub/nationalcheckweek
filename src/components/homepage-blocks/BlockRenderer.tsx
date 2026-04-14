'use client';

import dynamic from 'next/dynamic';

// HeroBlock is above-the-fold — keep it in the initial bundle for fastest LCP
import HeroBlock from './HeroBlock';

// All other blocks are below-the-fold — lazy load each as its own JS chunk.
// Next.js automatically prefetches these, so they're available before scroll.
const StatsBlock = dynamic(() => import('./StatsBlock'));
const FeaturesBlock = dynamic(() => import('./FeaturesBlock'));
const LogosBlock = dynamic(() => import('./LogosBlock'));
const CTABlock = dynamic(() => import('./CTABlock'));
const TestimonialsBlock = dynamic(() => import('./TestimonialsBlock'));
const SchoolsNavigatingDataBlock = dynamic(() => import('./SchoolsNavigatingDataBlock'));
const WellbeingAcrossAustraliaBlock = dynamic(() => import('./WellbeingAcrossAustraliaBlock'));
const WelcomeBlock = dynamic(() => import('./WelcomeBlock'));
const WhatIsItBlock = dynamic(() => import('./WhatIsItBlock'));
const WhyMattersBlock = dynamic(() => import('./WhyMattersBlock'));
const WhatMakesDifferentBlock = dynamic(() => import('./WhatMakesDifferentBlock'));
const WhatAndWhoBlock = dynamic(() => import('./WhatAndWhoBlock'));
const BePartCTABlock = dynamic(() => import('./BePartCTABlock'));
const HowToParticipateBlock = dynamic(() => import('./HowToParticipateBlock'));
const AmbassadorsBlock = dynamic(() => import('./AmbassadorsBlock'));
const HowLifeSkillsGOBlock = dynamic(() => import('./HowLifeSkillsGOBlock'));
const AmbassadorVoicesBlock = dynamic(() => import('./AmbassadorVoicesBlock'));
const PartnersSlideshowBlock = dynamic(() => import('./PartnersSlideshowBlock'));
const IfNotNowWhenBlock = dynamic(() => import('./IfNotNowWhenBlock'));
const YourVoiceBlock = dynamic(() => import('./YourVoiceBlock'));

interface HomepageBlock {
  id: string;
  block_type: string;
  title: string;
  content: any;
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

  return (
    <>
      {blocks.map((block) => {
        switch (block.block_type) {
          case 'hero':
            return <HeroBlock key={block.id} content={block.content} globalColors={globalColors} />;
          
          case 'stats':
            return <StatsBlock key={block.id} content={block.content} accentColor={globalColors.primaryButton} />;
          
          case 'features':
            return <FeaturesBlock key={block.id} content={block.content} accentColor={globalColors.primaryButton} />;
          
          case 'logos':
            return <LogosBlock key={block.id} content={block.content} />;
          
          case 'cta':
            return <CTABlock key={block.id} content={block.content} globalColors={globalColors} />;
          
          case 'testimonials':
            return <TestimonialsBlock key={block.id} content={block.content} accentColor={globalColors.primaryButton} />;
          
          case 'schools_navigating_data':
            return <SchoolsNavigatingDataBlock key={block.id} content={block.content} accentColor={globalColors.primaryButton} />;
          
          case 'wellbeing_across_australia':
            return <WellbeingAcrossAustraliaBlock key={block.id} content={block.content} accentColor={globalColors.primaryButton} />;
          
          case 'welcome':
            return <WelcomeBlock key={block.id} content={block.content} accentColor={globalColors.primaryButton} />;
          
          case 'what_is_it':
            return <WhatIsItBlock key={block.id} content={block.content} accentColor={globalColors.primaryButton} />;
          
          case 'why_matters':
            return <WhyMattersBlock key={block.id} content={block.content} accentColor={globalColors.primaryButton} />;
          
          case 'what_makes_different':
            return <WhatMakesDifferentBlock key={block.id} content={block.content} accentColor={globalColors.primaryButton} />;
          
          case 'what_and_who':
            return <WhatAndWhoBlock key={block.id} content={block.content} accentColor={globalColors.primaryButton} />;
          
          case 'be_part_cta':
            return <BePartCTABlock key={block.id} content={block.content} accentColor={globalColors.primaryButton} />;
          
          case 'how_to_participate':
            return <HowToParticipateBlock key={block.id} content={block.content} accentColor={globalColors.primaryButton} />;
          
          case 'ambassadors':
            return <AmbassadorsBlock key={block.id} content={block.content} accentColor={globalColors.primaryButton} />;
          
          case 'how_lifeskills_go':
            return <HowLifeSkillsGOBlock key={block.id} content={block.content} accentColor={globalColors.primaryButton} />;
          
          case 'ambassador_voices':
            return <AmbassadorVoicesBlock key={block.id} content={block.content} accentColor={globalColors.primaryButton} initialAmbassadors={ambassadors} />;

          case 'partners_slideshow':
            return <PartnersSlideshowBlock key={block.id} content={block.content} accentColor={globalColors.primaryButton} initialPartners={partners} />;

          case 'if_not_now_when':
            return <IfNotNowWhenBlock key={block.id} content={block.content} accentColor={globalColors.primaryButton} />;

          case 'your_voice':
            return <YourVoiceBlock key={block.id} content={block.content} accentColor={globalColors.primaryButton} />;
          
          default:
            console.warn(`Unknown block type: ${block.block_type}`);
            return null;
        }
      })}
    </>
  );
}
