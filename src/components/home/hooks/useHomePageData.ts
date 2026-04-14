import { useState, useEffect, useCallback } from "react";

interface HomePageData {
  hero: {
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
  };
  logos: Array<{
    id: string;
    organization_name: string;
    logo_url: string | null;
  }>;
  cta: {
    eyebrow_text: string;
    heading_text: string;
    description_text: string;
    primary_cta_text: string;
    primary_cta_link: string;
    secondary_cta_text: string;
    secondary_cta_link: string;
  };
}

const FALLBACK_DATA: HomePageData = {
  hero: {
    event_badge_emoji: '📅',
    event_badge_date: '25 May 2026',
    event_badge_location: 'Australia',
    heading_line1: 'Student Wellbeing:',
    heading_line2: 'A National Priority.',
    subheading: 'Join Australia\'s leading student wellbeing event — bridging data, experts and schools to create lasting change.',
    primary_cta_text: 'Register Now',
    primary_cta_link: '/events',
    secondary_cta_text: 'Learn More',
    secondary_cta_link: '/about',
    hero_image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800',
    countdown_target_date: '2026-05-25T00:00:00+10:00',
    countdown_label: 'Countdown to the event',
    show_countdown: true,
    stats_card_value: '15M+',
    stats_card_label: 'Students reached annually',
    show_stats_card: true,
    badge_text: '✓ 1,200+ Schools',
    show_badge: true,
  },
  logos: [
    { id: '1', organization_name: 'Department of Education', logo_url: '' },
    { id: '2', organization_name: 'Australian Curriculum', logo_url: '' },
    { id: '3', organization_name: 'Wellbeing Australia', logo_url: '' },
    { id: '4', organization_name: 'Mental Health Foundation', logo_url: '' },
  ],
  cta: {
    eyebrow_text: 'Join the Movement',
    heading_text: 'Ready to Make Student Wellbeing a Priority?',
    description_text: 'Join 1,200+ schools across Australia in the largest student wellbeing initiative. Register now for National Check-in Week 2026.',
    primary_cta_text: 'Register Your School',
    primary_cta_link: '/events',
    secondary_cta_text: 'Download Resources',
    secondary_cta_link: '/about',
  },
};

interface UseHomePageDataReturn {
  data: HomePageData;
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
}

/**
 * Custom hook for fetching and managing home page data.
 * 
 * Features:
 * - Accepts initial data from server-side rendering
 * - Falls back to default data for fast initial render
 * - Fetches fresh data from API if no initial data provided
 * - Handles abort controller for cleanup
 * - Merges API data with fallbacks
 * - Provides loading and error states
 * - Retry functionality
 * 
 * @param initialData - Optional initial data from server
 * @returns Object with data, loading state, error, and retry function
 */
export function useHomePageData(initialData?: Partial<HomePageData> | null): UseHomePageDataReturn {
  const mergedInitialData: HomePageData = {
    hero: initialData?.hero || FALLBACK_DATA.hero,
    logos: initialData?.logos && initialData.logos.length > 0 ? initialData.logos : FALLBACK_DATA.logos,
    cta: initialData?.cta || FALLBACK_DATA.cta,
  };
  
  const [data, setData] = useState<HomePageData>(mergedInitialData);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(() => {
    if (initialData) return;
    
    setIsLoading(true);
    setError(null);
    
    const controller = new AbortController();
    
    fetch('/api/home-page', { signal: controller.signal })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then(result => {
        const mergedData: HomePageData = {
          hero: result.hero || FALLBACK_DATA.hero,
          logos: result.logos && result.logos.length > 0 ? result.logos : FALLBACK_DATA.logos,
          cta: result.cta || FALLBACK_DATA.cta,
        };
        setData(mergedData);
        setIsLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch home page data:', err);
          setError(err instanceof Error ? err : new Error('Failed to fetch home page data'));
          setIsLoading(false);
        }
      });
    
    return () => controller.abort();
  }, [initialData]);

  useEffect(() => {
    const cleanup = fetchData();
    return cleanup;
  }, [fetchData]);
  
  return { data, isLoading, error, retry: fetchData };
}
