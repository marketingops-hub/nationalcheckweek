"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useHomePageData } from "./home/hooks/useHomePageData";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { HeroSection } from "./home/sections/HeroSection";
import { LogosSection } from "./home/sections/LogosSection";
import { ImpactSection } from "./home/sections/ImpactSection";
import { WhyMattersSection } from "./home/sections/WhyMattersSection";
import { ParticipateSection } from "./home/sections/ParticipateSection";
import { SpeakersSection } from "./home/sections/SpeakersSection";
import { CTASection } from "./home/sections/CTASection";

interface HeroData {
  event_badge_emoji: string;
  event_badge_date: string;
  event_badge_location: string;
  heading_line1: string;
  heading_line2: string;
  subheading: string;
  primary_cta_text: string;
  primary_cta_link: string;
  secondary_cta_text: string;
  secondary_cta_link: string;
  hero_image_url: string;
  countdown_target_date: string;
  countdown_label: string;
  show_countdown: boolean;
  stats_card_value: string;
  stats_card_label: string;
  show_stats_card: boolean;
  badge_text: string;
  show_badge: boolean;
}

interface LogoData {
  id: string;
  organization_name: string;
  logo_url: string | null;
}

interface CTAData {
  eyebrow_text: string;
  heading_text: string;
  description_text: string;
  primary_cta_text: string;
  primary_cta_link: string;
  secondary_cta_text: string;
  secondary_cta_link: string;
}

interface Home1ClientProps {
  initialData?: {
    hero: HeroData;
    logos: LogoData[];
    cta: CTAData;
  } | null;
}

/**
 * Home1Client - Main homepage client component.
 * 
 * Orchestrates all homepage sections with dynamic content from the admin API.
 * Uses a modular architecture with individual section components for maintainability.
 * 
 * Features:
 * - Server-side rendering support with initialData
 * - Client-side data fetching with fallbacks
 * - Modular section components
 * - Custom hook for data management
 * - Scroll animations
 * - Abort controller for cleanup
 * 
 * Architecture:
 * - Each section is a separate component in `./home/sections/`
 * - Data fetching logic is in `useHomePageData` hook
 * - Fallback data ensures fast initial render
 * 
 * @param initialData - Optional server-rendered data
 * @returns Client-rendered homepage content
 * 
 * @example
 * ```tsx
 * // Server component
 * const data = await fetchHomePageData();
 * return <Home1Client initialData={data} />;
 * 
 * // Client-only
 * return <Home1Client />;
 * ```
 */
export default function Home1Client({ initialData }: Home1ClientProps = {}) {
  useScrollAnimation();
  const { data, isLoading, error, retry } = useHomePageData(initialData);
  
  // Show error state with retry option
  if (error) {
    return (
      <main id="main-content" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Failed to Load Page Content
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            {error.message}
          </p>
          <button
            onClick={retry}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: '0.5rem',
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }
  
  // Show loading skeleton
  if (isLoading) {
    return (
      <main id="main-content" style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ 
            height: '400px', 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: '1rem',
            marginBottom: '2rem'
          }} />
          <div style={{ 
            height: '200px', 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: '1rem'
          }} />
        </div>
        <style jsx>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
      </main>
    );
  }
  
  return (
    <main id="main-content">
      <ErrorBoundary>
        <HeroSection data={data.hero} />
      </ErrorBoundary>
      <ErrorBoundary>
        <LogosSection logos={data.logos} />
      </ErrorBoundary>
      <ErrorBoundary>
        <ImpactSection />
      </ErrorBoundary>
      <ErrorBoundary>
        <WhyMattersSection />
      </ErrorBoundary>
      <ErrorBoundary>
        <ParticipateSection />
      </ErrorBoundary>
      <ErrorBoundary>
        <SpeakersSection />
      </ErrorBoundary>
      <ErrorBoundary>
        <CTASection data={data.cta} />
      </ErrorBoundary>
    </main>
  );
}
