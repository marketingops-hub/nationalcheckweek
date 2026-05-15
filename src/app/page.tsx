import Header from "@/components/Header";
import FooterModern from "@/components/FooterModern";
import BlockRenderer from "@/components/homepage-blocks/BlockRenderer";
import { createClient } from "@/lib/supabase/server";

// Enable ISR - revalidate every hour (3600 seconds)
// Homepage content is mostly static, no need to revalidate every minute
export const revalidate = 3600;

export const metadata = {
  title: "National Check-in Week 2026 — Student Wellbeing: A National Priority",
  description:
    "Join Australia's leading student wellbeing event. Free webinars, expert panels, data, and resources for every school.",
  openGraph: {
    title: "National Check-in Week 2026",
    description: "Free webinars, expert panels, and wellbeing resources for Australian schools.",
    url: "https://nationalcheckinweek.com",
  },
};

// Fetch home page data on the server
async function getHomePageData() {
  try {
    const sb = await createClient();
    
    // Fetch all homepage data in parallel — blocks, settings, partners, ambassadors
    const [blocksRes, globalSettingsRes, partnersRes, ambassadorsRes] = await Promise.all([
      sb.from('homepage_blocks').select('*').eq('is_visible', true).order('display_order', { ascending: true }),
      sb.from('homepage_global_settings').select('*').eq('setting_key', 'global_colors').single(),
      sb.from('Partner').select('id, name, description, logoUrl, url, slug').eq('active', true).order('sortOrder', { ascending: true }),
      sb.from('Ambassador').select('id, name, title, photoUrl, comment, event_link, sortOrder').eq('active', true).order('sortOrder', { ascending: true }),
    ]);

    if (blocksRes.error) {
      console.error('[SSR] Failed to fetch homepage blocks:', blocksRes.error);
    }

    if (globalSettingsRes.error) {
      console.error('[SSR] Failed to fetch global settings:', globalSettingsRes.error);
    }

    // Extract global colors from new settings table
    const settingsValue = globalSettingsRes.data?.setting_value || {};
    const globalColors = {
      primaryButton: settingsValue.primaryButton || '#29B8E8',
      primaryButtonText: settingsValue.primaryButtonText || '#FFFFFF',
      secondaryButton: settingsValue.secondaryButton || 'rgba(255,255,255,0.2)',
      secondaryButtonText: settingsValue.secondaryButtonText || '#FFFFFF',
      heading: settingsValue.heading || '#0f0e1a',
      subheading: settingsValue.subheading || '#4a4768',
      ctaBackground: settingsValue.ctaBackground || '#0B1D35',
      ctaText: settingsValue.ctaText || '#FFFFFF',
      ctaPrimaryButton: settingsValue.ctaPrimaryButton || '#29B8E8',
    };

    return {
      blocks: blocksRes.data || [],
      globalColors,
      partners: partnersRes.data || [],
      ambassadors: ambassadorsRes.data || [],
    };
  } catch (err) {
    console.error('[SSR] Failed to fetch home page data:', err);
    return {
      blocks: [],
      partners: [],
      ambassadors: [],
      globalColors: {
        primaryButton: '#29B8E8',
        primaryButtonText: '#FFFFFF',
        secondaryButton: 'rgba(255,255,255,0.2)',
        secondaryButtonText: '#FFFFFF',
        heading: '#0f0e1a',
        subheading: '#4a4768',
        ctaBackground: '#0B1D35',
        ctaText: '#FFFFFF',
        ctaPrimaryButton: '#29B8E8',
      },
    };
  }
}

export default async function Home() {
  const data = await getHomePageData();
  
  return (
    <div className="home1-root" style={{ minHeight: "100vh", background: "#fff" }}>
      <Header />
      <main>
        <BlockRenderer
          blocks={data.blocks}
          globalColors={data.globalColors}
          partners={data.partners}
          ambassadors={data.ambassadors}
        />
      </main>
      <FooterModern />
    </div>
  );
}


