"use client";
import { useEffect, useRef } from "react";

/* Severity fill colours per state */
const STATE_SEVERITY: Record<string, "critical" | "high" | "notable"> = {
  "New South Wales":             "high",
  "Victoria":                    "high",
  "Queensland":                  "critical",
  "South Australia":             "high",
  "Western Australia":           "critical",
  "Tasmania":                    "high",
  "Northern Territory":          "critical",
  "Australian Capital Territory":"notable",
};

const SEVERITY_COLOR = {
  critical: "#B91C1C",
  high:     "#B45309",
  notable:  "#15803D",
};

const SEVERITY_ACTIVE = {
  critical: "#7F1D1D",
  high:     "#78350F",
  notable:  "#14532D",
};

const STATE_ABBR: Record<string, string> = {
  "New South Wales":             "NSW",
  "Victoria":                    "VIC",
  "Queensland":                  "QLD",
  "South Australia":             "SA",
  "Western Australia":           "WA",
  "Tasmania":                    "TAS",
  "Northern Territory":          "NT",
  "Australian Capital Territory":"ACT",
};

/* Normalise property names from different GeoJSON sources */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stateName(d: any): string {
  const p = d.properties ?? {};
  return (
    p.STATE_NAME ?? p.ste_name ?? p.ste_name16 ?? p.name ?? p.Name ??
    p.STATE ?? p.state ?? p.admin ?? ""
  );
}

interface Props {
  onSelectState: (name: string) => void;
  selectedState: string | null;
}

export default function AusMap({ onSelectState, selectedState }: Props) {
  const svgRef    = useRef<SVGSVGElement>(null);
  const rendered  = useRef(false);
  /* keep a stable ref to selectedState so event handlers see current value */
  const selRef    = useRef(selectedState);
  selRef.current  = selectedState;

  /* Re-stroke selected path whenever selectedState changes */
  useEffect(() => {
    if (!svgRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d3sel = (window as any).__d3sel;
    if (!d3sel) return;
    const { svg, pathGen, geoData } = d3sel;
    applySelection(svg, pathGen, geoData, selectedState);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState]);

  useEffect(() => {
    if (rendered.current) return;
    rendered.current = true;

    async function build() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d3: any = await import("d3");

      const W = 960, H = 680;
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      /* Ocean background */
      svg.append("rect")
        .attr("width", W).attr("height", H)
        .attr("fill", "#EFF6FF");

      /* Try multiple reliable GeoJSON sources in order */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let geoData: any = null;
      const SOURCES = [
        "https://raw.githubusercontent.com/rowanhogan/australian-states/master/states.min.geojson",
        "https://raw.githubusercontent.com/matteason/australian-state-boundaries/main/states.geojson",
        "https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson",
      ];
      for (const url of SOURCES) {
        try {
          const r = await fetch(url);
          if (!r.ok) continue;
          const json = await r.json();
          /* Only accept if it has Australian state-level features */
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const names = (json.features ?? []).map((f: any) => stateName(f)).filter(Boolean);
          if (names.some((n: string) => n.includes("Wales") || n.includes("Victoria") || n.includes("Queensland"))) {
            geoData = json;
            break;
          }
        } catch { /* try next */ }
      }

      if (!geoData) {
        svg.append("text")
          .attr("x", W / 2).attr("y", H / 2)
          .attr("text-anchor", "middle")
          .attr("fill", "#64748B")
          .attr("font-size", "16")
          .text("Map unavailable — check your connection");
        return;
      }

      const projection = d3.geoMercator().fitSize([W, H], geoData);
      const pathGen = d3.geoPath().projection(projection);

      const paths = svg.selectAll(".sp")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("class", "sp")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("d", (d: any) => pathGen(d) ?? "")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("fill", (d: any) => {
          const sev = STATE_SEVERITY[stateName(d)] ?? "notable";
          return SEVERITY_COLOR[sev];
        })
        .attr("fill-opacity", 0.82)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .style("cursor", "pointer")
        .style("transition", "fill-opacity 0.15s");

      /* Hover */
      paths
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on("mouseover", function(this: any, _: any, d: any) {
          if (stateName(d) !== selRef.current) {
            d3.select(this).attr("fill-opacity", 0.65);
          }
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on("mouseout", function(this: any, _: any, d: any) {
          if (stateName(d) !== selRef.current) {
            d3.select(this).attr("fill-opacity", 0.82);
          }
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on("click", function(this: any, _: any, d: any) {
          onSelectState(stateName(d));
        });

      /* State abbreviation labels */
      svg.selectAll(".sl")
        .data(geoData.features)
        .enter()
        .append("text")
        .attr("class", "sl")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("x", (d: any) => pathGen.centroid(d)[0])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("y", (d: any) => pathGen.centroid(d)[1])
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("font-size", (d: any) => stateName(d) === "Australian Capital Territory" ? "9" : "13")
        .attr("font-weight", "700")
        .attr("font-family", "Inter, -apple-system, sans-serif")
        .attr("fill", "#ffffff")
        .attr("paint-order", "stroke")
        .attr("stroke", "rgba(0,0,0,0.45)")
        .attr("stroke-width", "3")
        .style("pointer-events", "none")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .text((d: any) => STATE_ABBR[stateName(d)] ?? "");

      /* Store references so the selection-sync effect can reach them */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__d3sel = { svg, pathGen, geoData };

      /* Apply any already-set selection */
      applySelection(svg, pathGen, geoData, selRef.current);
    }

    build();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="map-wrapper">
      <div className="map-hint">Click a state or territory to explore regional data</div>
      <svg
        ref={svgRef}
        viewBox="0 0 960 680"
        style={{ width: "100%", height: "auto", display: "block" }}
        aria-label="Interactive map of Australia"
      />
      <div className="map-legend">
        <div className="legend-item"><div className="legend-dot dot-critical" /> Critical concern</div>
        <div className="legend-item"><div className="legend-dot dot-high" /> Elevated concern</div>
        <div className="legend-item"><div className="legend-dot dot-notable" /> Notable concern</div>
      </div>
    </div>
  );
}

/* ── helpers ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySelection(svg: any, _pathGen: unknown, _geoData: unknown, selected: string | null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  svg.selectAll(".sp").each(function(this: SVGPathElement, d: any) {
    const name = stateName(d);
    const isSelected = name === selected;
    const sev = STATE_SEVERITY[name] ?? "notable";
    this.setAttribute("fill", isSelected ? SEVERITY_ACTIVE[sev] : SEVERITY_COLOR[sev]);
    this.setAttribute("fill-opacity", isSelected ? "1" : "0.82");
    this.setAttribute("stroke", isSelected ? "#0B1D35" : "#ffffff");
    this.setAttribute("stroke-width", isSelected ? "3" : "1.5");
  });
}
