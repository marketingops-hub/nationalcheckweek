"use client";
import { useState } from "react";
import AusMap from "./AusMap";
import RegionPanel from "./RegionPanel";
import { REGIONAL } from "@/lib/regional";

export default function MapSection() {
  const [selectedState, setSelectedState] = useState<string | null>(null);

  return (
    <section className="section section-alt" id="map">
      <div className="section-tag">Interactive Regional Data</div>
      <h2>Wellbeing Across Australia</h2>
      <p className="section-lead">
        Click any state or territory to explore the most pressing school wellbeing issues in that region, grounded in Australian data from the AIHW Youth Self-Harm Atlas, RoGS 2026, and state-level reporting.
      </p>
      <div className="map-layout">
        <div>
          <AusMap onSelectState={setSelectedState} selectedState={selectedState} />
        </div>
        <div>
          <RegionPanel
            name={selectedState}
            data={selectedState ? REGIONAL[selectedState] ?? null : null}
          />
        </div>
      </div>
    </section>
  );
}
