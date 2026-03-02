import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import NewsTicker from "@/components/NewsTicker";
import StatTicker from "@/components/StatTicker";
import MapSection from "@/components/MapSection";
import IssuesSection from "@/components/IssuesSection";
import LifeSkillsSection from "@/components/LifeSkillsSection";
import ResearchSection from "@/components/ResearchSection";
import DataSection from "@/components/DataSection";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <NewsTicker />
      <Hero />
      <StatTicker />
      <MapSection />
      <IssuesSection />
      <LifeSkillsSection />
      <ResearchSection />
      <DataSection />
      <FinalCTA />
      <Footer />
    </>
  );
}
