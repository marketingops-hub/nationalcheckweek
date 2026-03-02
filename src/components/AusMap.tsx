"use client";
import { useEffect, useRef } from "react";

const STATE_COLORS: Record<string, string> = {
  "New South Wales": "#B8820F",
  "Victoria": "#B8820F",
  "Queensland": "#AC2E2A",
  "South Australia": "#B8820F",
  "Western Australia": "#AC2E2A",
  "Tasmania": "#B8820F",
  "Northern Territory": "#AC2E2A",
  "Australian Capital Territory": "#2E6147",
};

const STATE_ABBR: Record<string, string> = {
  "New South Wales": "NSW",
  "Victoria": "VIC",
  "Queensland": "QLD",
  "South Australia": "SA",
  "Western Australia": "WA",
  "Tasmania": "TAS",
  "Northern Territory": "NT",
  "Australian Capital Territory": "ACT",
};

function getInlineGeoJSON() {
  return {
    type: "FeatureCollection",
    features: [
      { type: "Feature", properties: { STATE_NAME: "Western Australia" }, geometry: { type: "Polygon", coordinates: [[[113.3,-22.0],[114.2,-21.8],[115.0,-21.0],[116.0,-20.7],[118.0,-20.3],[120.0,-19.5],[122.0,-18.6],[124.0,-17.1],[125.0,-16.5],[126.0,-15.9],[127.0,-15.6],[128.0,-15.3],[129.0,-15.0],[129.0,-35.0],[125.5,-33.9],[122.2,-33.9],[119.2,-34.0],[116.0,-34.2],[114.0,-34.3],[113.5,-34.7],[113.0,-34.9],[112.5,-34.0],[112.9,-33.0],[114.0,-31.0],[114.0,-22.0],[113.3,-22.0]]] } },
      { type: "Feature", properties: { STATE_NAME: "Northern Territory" }, geometry: { type: "Polygon", coordinates: [[[129.0,-15.0],[130.0,-14.9],[131.0,-11.8],[132.0,-11.2],[133.0,-11.1],[134.0,-11.8],[136.0,-12.0],[136.0,-26.0],[138.0,-26.0],[138.0,-29.0],[129.0,-29.0],[129.0,-15.0]]] } },
      { type: "Feature", properties: { STATE_NAME: "South Australia" }, geometry: { type: "Polygon", coordinates: [[[129.0,-29.0],[138.0,-29.0],[138.0,-26.0],[141.0,-26.0],[141.0,-34.0],[140.9,-35.7],[140.5,-36.0],[139.8,-36.8],[138.9,-37.3],[138.1,-37.6],[137.5,-35.7],[136.6,-35.8],[136.1,-34.8],[135.2,-34.8],[134.7,-33.4],[133.8,-32.1],[132.5,-32.1],[131.8,-31.8],[130.0,-31.6],[129.0,-31.5],[129.0,-29.0]]] } },
      { type: "Feature", properties: { STATE_NAME: "Queensland" }, geometry: { type: "Polygon", coordinates: [[[138.0,-26.0],[141.0,-26.0],[141.0,-29.0],[149.0,-30.5],[151.0,-30.0],[153.0,-29.5],[153.5,-28.0],[152.5,-26.0],[151.0,-24.0],[150.0,-22.5],[149.0,-21.0],[148.0,-19.5],[147.0,-18.0],[146.0,-16.0],[145.0,-15.0],[144.0,-14.3],[143.0,-14.0],[142.0,-14.5],[141.0,-16.0],[141.0,-19.0],[141.0,-22.0],[141.0,-26.0],[138.0,-26.0]]] } },
      { type: "Feature", properties: { STATE_NAME: "New South Wales" }, geometry: { type: "Polygon", coordinates: [[[141.0,-29.0],[149.0,-30.5],[151.0,-30.0],[153.0,-29.5],[153.5,-28.0],[154.0,-29.5],[153.5,-33.5],[152.5,-34.5],[151.5,-35.5],[150.5,-36.5],[150.0,-37.5],[149.5,-37.8],[148.3,-37.5],[147.5,-37.5],[147.0,-37.0],[146.3,-36.5],[145.5,-36.0],[144.5,-36.5],[143.5,-36.5],[142.5,-36.9],[141.5,-37.0],[141.0,-37.0],[141.0,-29.0]]] } },
      { type: "Feature", properties: { STATE_NAME: "Australian Capital Territory" }, geometry: { type: "Polygon", coordinates: [[[148.8,-35.1],[149.4,-35.1],[149.4,-35.9],[148.8,-35.9],[148.8,-35.1]]] } },
      { type: "Feature", properties: { STATE_NAME: "Victoria" }, geometry: { type: "Polygon", coordinates: [[[141.0,-37.0],[141.5,-37.0],[142.5,-36.9],[143.5,-36.5],[144.5,-36.5],[145.5,-36.0],[146.3,-36.5],[147.0,-37.0],[147.5,-37.5],[148.3,-37.5],[149.5,-37.8],[150.0,-37.5],[150.7,-38.5],[150.0,-38.9],[149.0,-38.4],[148.0,-39.0],[147.0,-38.8],[146.0,-38.6],[145.0,-38.5],[144.0,-38.3],[143.0,-38.5],[142.0,-38.6],[141.6,-38.3],[141.0,-38.0],[141.0,-37.0]]] } },
      { type: "Feature", properties: { STATE_NAME: "Tasmania" }, geometry: { type: "Polygon", coordinates: [[[144.5,-40.5],[145.5,-40.3],[147.0,-40.8],[148.5,-41.5],[148.5,-42.5],[148.0,-43.5],[147.0,-44.0],[145.5,-43.7],[144.5,-43.0],[143.5,-42.0],[144.5,-40.5]]] } },
    ],
  };
}

interface Props {
  onSelectState: (name: string) => void;
  selectedState: string | null;
}

export default function AusMap({ onSelectState, selectedState }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const builtRef = useRef(false);

  useEffect(() => {
    if (builtRef.current) return;
    builtRef.current = true;

    async function build() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d3 = await import("d3") as any;
      const svg = d3.select(svgRef.current!);
      const W = 960, H = 720;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let geoData: any = null;
      const sources = [
        "https://raw.githubusercontent.com/tonywr71/GeoJson-Data/master/australian-states.json",
        "https://raw.githubusercontent.com/rowanhogan/australian-states/master/states.min.geojson",
      ];
      for (const url of sources) {
        try {
          const res = await fetch(url);
          if (res.ok) { geoData = await res.json(); break; }
        } catch { /* try next */ }
      }
      if (!geoData) geoData = getInlineGeoJSON();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function stateName(d: any): string {
        const p = d.properties ?? {};
        return p.STATE_NAME || p.name || p.Name || p.STATE || p.ste_name16 || "";
      }

      const projection = d3.geoMercator().fitSize([W, H], geoData);
      const pathGen = d3.geoPath().projection(projection);

      svg.selectAll(".state-path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("class", "state-path")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("d", (d: any) => pathGen(d) || "")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("fill", (d: any) => STATE_COLORS[stateName(d)] || "#2E6147")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.85)
        .style("cursor", "pointer")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on("mouseover", function (this: any, _: any, d: any) {
          if (stateName(d) !== selectedState) d3.select(this).attr("opacity", 0.65);
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on("mouseout", function (this: any, _: any, d: any) {
          if (stateName(d) !== selectedState) d3.select(this).attr("opacity", 0.85);
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on("click", function (this: any, _: any, d: any) {
          svg.selectAll(".state-path").attr("opacity", 0.85).attr("stroke-width", 1.5).attr("stroke", "#fff");
          d3.select(this).attr("opacity", 1).attr("stroke-width", 3).attr("stroke", "#0D1F38");
          onSelectState(stateName(d));
        });

      svg.selectAll(".state-label")
        .data(geoData.features)
        .enter()
        .append("text")
        .attr("class", "state-label")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("x", (d: any) => pathGen.centroid(d)[0])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("y", (d: any) => pathGen.centroid(d)[1])
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "Georgia, serif")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("font-size", (d: any) => stateName(d) === "Australian Capital Territory" ? "9px" : "13px")
        .attr("font-weight", "bold")
        .attr("fill", "#fff")
        .attr("paint-order", "stroke")
        .attr("stroke", "rgba(0,0,0,0.5)")
        .attr("stroke-width", "3px")
        .style("pointer-events", "none")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .text((d: any) => STATE_ABBR[stateName(d)] || "");
    }

    build();
  }, [onSelectState, selectedState]);

  return (
    <div className="map-wrapper">
      <p>Click a state or territory to explore its data</p>
      <svg ref={svgRef} viewBox="0 0 960 720" style={{ width: "100%", height: "auto", display: "block" }} />
      <div className="map-legend">
        <div className="legend-item"><div className="legend-dot dot-critical" /> Critical concern</div>
        <div className="legend-item"><div className="legend-dot dot-high" /> Elevated concern</div>
        <div className="legend-item"><div className="legend-dot dot-notable" /> Notable concern</div>
      </div>
    </div>
  );
}
