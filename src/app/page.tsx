import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import IntroSection from "@/components/IntroSection";
import NewsTicker from "@/components/NewsTicker";
import StatTicker from "@/components/StatTicker";
import MapSection from "@/components/MapSection";
import IssuesSection from "@/components/IssuesSection";
import LifeSkillsSection from "@/components/LifeSkillsSection";
import ResearchSection from "@/components/ResearchSection";
import DataSection from "@/components/DataSection";
import FinalCTA from "@/components/FinalCTA";
import PartnersCarousel from "@/components/PartnersCarousel";
import MovementSection from "@/components/MovementSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Nav />
      <NewsTicker />
      <Hero />
      <IntroSection />
      <StatTicker />
      <main id="main-content">
        <MapSection />
        <IssuesSection />
        <LifeSkillsSection />
        <ResearchSection />
        <DataSection />
        <PartnersCarousel />
        <MovementSection />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
