import { useState, useEffect, useCallback } from "react";
import { adminFetch } from "@/lib/adminFetch";
import type { HeroSettings, Logo, CTASettings, FooterSettings } from "../types";

interface HomePageData {
  heroSettings: HeroSettings;
  logos: Logo[];
  ctaSettings: CTASettings;
  footerSettings: FooterSettings;
}

/**
 * Custom hook for fetching and managing all homepage data.
 * Handles loading state, error handling, and provides refresh functionality.
 * 
 * @returns Object containing all homepage data, loading state, error, and refresh function
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refresh } = useHomePageData();
 * 
 * if (loading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error}</div>;
 * 
 * return <div>{data.heroSettings.heading_line1}</div>;
 * ```
 */
export function useHomePageData() {
  const [data, setData] = useState<HomePageData>({
    heroSettings: {},
    logos: [],
    ctaSettings: {},
    footerSettings: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAllSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    
    const abortController = new AbortController();
    
    try {
      const [heroRes, logosRes, ctaRes, footerRes] = await Promise.all([
        adminFetch("/api/admin/home-page/hero", { signal: abortController.signal }),
        adminFetch("/api/admin/home-page/logos", { signal: abortController.signal }),
        adminFetch("/api/admin/home-page/cta", { signal: abortController.signal }),
        adminFetch("/api/admin/home-page/footer", { signal: abortController.signal }),
      ]);

      // Check for HTTP errors
      if (!heroRes.ok || !logosRes.ok || !ctaRes.ok || !footerRes.ok) {
        throw new Error("Failed to fetch one or more homepage settings");
      }

      const [heroData, logosData, ctaData, footerData] = await Promise.all([
        heroRes.json(),
        logosRes.json(),
        ctaRes.json(),
        footerRes.json(),
      ]);

      // Validate response structure
      if (heroData && typeof heroData === 'object') {
        setData({
          heroSettings: heroData,
          logos: Array.isArray(logosData?.logos) ? logosData.logos : [],
          ctaSettings: ctaData && typeof ctaData === 'object' ? ctaData : {},
          footerSettings: footerData?.settings && typeof footerData.settings === 'object' 
            ? footerData.settings 
            : {},
        });
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      // Don't set error if request was aborted (component unmounted)
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Failed to load homepage settings";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }

    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    const cleanup = fetchAllSettings();
    return () => {
      cleanup?.then(fn => fn?.());
    };
  }, [fetchAllSettings]);

  return { 
    data, 
    loading, 
    error, 
    refresh: fetchAllSettings,
    setHeroSettings: (settings: HeroSettings) => setData(prev => ({ ...prev, heroSettings: settings })),
    setLogos: (logos: Logo[]) => setData(prev => ({ ...prev, logos })),
    setCTASettings: (settings: CTASettings) => setData(prev => ({ ...prev, ctaSettings: settings })),
    setFooterSettings: (settings: FooterSettings) => setData(prev => ({ ...prev, footerSettings: settings })),
  };
}
