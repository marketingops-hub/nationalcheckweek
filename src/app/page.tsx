import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import StatTicker from "@/components/StatTicker";
import MapSection from "@/components/MapSection";
import IssuesSection from "@/components/IssuesSection";
import LifeSkillsSection from "@/components/LifeSkillsSection";
import ResearchSection from "@/components/ResearchSection";
import DataSection from "@/components/DataSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <StatTicker />
      <MapSection />
      <IssuesSection />
      <LifeSkillsSection />
      <ResearchSection />
      <DataSection />
      <Footer />
    </>
  );
}
