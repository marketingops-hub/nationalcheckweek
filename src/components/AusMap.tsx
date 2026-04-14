"use client";
import { useEffect, useRef, useState } from "react";
import { SEVERITY } from "@/lib/colors";
import { STATE_SEVERITY, STATE_ABBR } from "@/lib/data/states";

const W = 800, H = 560;

/* Major cities with approximate [lon, lat] */
const CITIES: { name: string; lon: number; lat: number; state: string }[] = [
  { name: "Sydney",       lon: 151.21, lat: -33.87, state: "New South Wales" },
  { name: "Newcastle",    lon: 151.78, lat: -32.93, state: "New South Wales" },
  { name: "Wollongong",   lon: 150.89, lat: -34.43, state: "New South Wales" },
  { name: "Melbourne",    lon: 144.96, lat: -37.81, state: "Victoria" },
  { name: "Geelong",      lon: 144.35, lat: -38.15, state: "Victoria" },
  { name: "Brisbane",     lon: 153.02, lat: -27.47, state: "Queensland" },
  { name: "Gold Coast",   lon: 153.40, lat: -28.00, state: "Queensland" },
  { name: "Townsville",   lon: 146.82, lat: -19.26, state: "Queensland" },
  { name: "Cairns",       lon: 145.77, lat: -16.92, state: "Queensland" },
  { name: "Adelaide",     lon: 138.60, lat: -34.93, state: "South Australia" },
  { name: "Perth",        lon: 115.86, lat: -31.95, state: "Western Australia" },
  { name: "Bunbury",      lon: 115.64, lat: -33.32, state: "Western Australia" },
  { name: "Hobart",       lon: 147.33, lat: -42.88, state: "Tasmania" },
  { name: "Darwin",       lon: 130.84, lat: -12.46, state: "Northern Territory" },
  { name: "Canberra",     lon: 149.13, lat: -35.28, state: "Australian Capital Territory" },
];

interface Props {
  onSelectState: (name: string) => void;
  selectedState: string | null;
}

interface StateShape {
  name: string;
  d: string;
  cx: number;
  cy: number;
}

export default function AusMap({ onSelectState, selectedState }: Props) {
  const svgRef  = useRef<SVGSVGElement>(null);
  const built   = useRef(false);
  const [shapes, setShapes] = useState<StateShape[]>([]);
  const [cities, setCities] = useState<{ name: string; x: number; y: number; state: string }[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (built.current) return;
    built.current = true;

    async function build() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d3: any = await import("d3");

        /* Fetch from /public — guaranteed local, no CDN */
        const res = await fetch("/states.min.geojson");
        if (!res.ok) throw new Error("Failed to fetch");
        const geo = await res.json();

        const projection = d3.geoMercator().fitSize([W, H], geo);
        const pathGen    = d3.geoPath().projection(projection);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const built: StateShape[] = geo.features.map((f: any) => {
          const name = f.properties.STATE_NAME as string;
          const d    = pathGen(f) as string;
          const [cx, cy] = pathGen.centroid(f) as [number, number];
          return { name, d, cx: Math.round(cx), cy: Math.round(cy) };
        });

        const projectedCities = CITIES.map(c => {
          const [x, y] = projection([c.lon, c.lat]) as [number, number];
          return { name: c.name, x: Math.round(x), y: Math.round(y), state: c.state };
        });

        setShapes(built);
        setCities(projectedCities);
        setLoading(false);
      } catch {
        setLoading(false);
        setError(true);
      }
    }

    build();
  }, []);

  return (
    <div className="map-wrapper" style={{ position: "relative" }}>
      <div className="map-hint">Click any state or territory to explore its regional data</div>

      {loading && !error && (
        <div className="map-skeleton">
          <div className="map-skeleton__spinner" />
          <span className="map-skeleton__text">Loading map…</span>
        </div>
      )}

      {error && (
        <div className="map-error">Map unavailable. Please refresh the page.</div>
      )}

      {!loading && !error && (
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: "auto", display: "block", background: "#DBEAFE", borderRadius: "8px" }}
          aria-label="Interactive map of Australia showing wellbeing data by state"
        >
          {/* Ocean */}
          <rect width={W} height={H} fill="#BFDBFE" rx="8" />

          {/* State paths */}
          {shapes.map(s => {
            const sev  = STATE_SEVERITY[s.name] ?? "notable";
            const sevCfg = SEVERITY[sev];
            const fill = hovered === s.name ? sevCfg.hover : sevCfg.color;
            return (
              <path
                key={s.name}
                d={s.d}
                fill={fill}
                fillOpacity={0.88}
                stroke="#FFFFFF"
                strokeWidth={hovered === s.name ? 2.5 : 1.5}
                strokeLinejoin="round"
                style={{ cursor: "pointer", transition: "fill 0.15s, stroke-width 0.1s" }}
                onClick={() => onSelectState(s.name)}
                onMouseEnter={e => {
                  setHovered(s.name);
                  const svg = svgRef.current!;
                  const rect = svg.getBoundingClientRect();
                  const scaleX = W / rect.width;
                  const scaleY = H / rect.height;
                  let mx = (e.clientX - rect.left) * scaleX;
                  let my = (e.clientY - rect.top)  * scaleY;
                  const ttW = s.name.length * 7 + 26;
                  if (mx + ttW > W) mx = mx - ttW - 10;
                  if (my - 22 < 0) my = 30;
                  setTooltip({ name: s.name, x: mx, y: my });
                }}
                onMouseLeave={() => { setHovered(null); setTooltip(null); }}
                aria-label={`${s.name} — click to explore`}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === "Enter" && onSelectState(s.name)}
              />
            );
          })}

          {/* State abbreviation labels */}
          {shapes.map(s => {
            const isACT = s.name === "Australian Capital Territory";
            const isWA  = s.name === "Western Australia";
            return (
              <text
                key={`lbl-${s.name}`}
                x={s.cx}
                y={s.cy}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={isACT ? 8 : isWA ? 15 : 13}
                fontWeight="800"
                fontFamily="Inter, -apple-system, sans-serif"
                fill="#FFFFFF"
                stroke="rgba(0,0,0,0.5)"
                strokeWidth="3"
                paintOrder="stroke"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {STATE_ABBR[s.name] ?? ""}
              </text>
            );
          })}

          {/* City dots */}
          {cities.map(c => (
            <g key={`city-${c.name}`} style={{ pointerEvents: "none" }}>
              <circle cx={c.x} cy={c.y} r={3.5} fill="#FFFFFF" stroke="#1E3A5F" strokeWidth={1.2} opacity={0.9} />
              <text
                x={c.x + 5}
                y={c.y}
                fontSize={7.5}
                fontFamily="Inter, -apple-system, sans-serif"
                fill="#1E3A5F"
                dominantBaseline="central"
                fontWeight="600"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="2"
                paintOrder="stroke"
              >
                {c.name}
              </text>
            </g>
          ))}

          {/* Hover tooltip */}
          {tooltip && (
            <g style={{ pointerEvents: "none" }}>
              <rect
                x={tooltip.x + 10}
                y={tooltip.y - 22}
                width={tooltip.name.length * 7 + 16}
                height={26}
                rx={5}
                fill="#0B1D35"
                opacity={0.92}
              />
              <text
                x={tooltip.x + 18}
                y={tooltip.y - 5}
                fontSize={11}
                fontWeight="700"
                fontFamily="Inter, -apple-system, sans-serif"
                fill="#FFFFFF"
              >
                {tooltip.name} →
              </text>
            </g>
          )}
        </svg>
      )}

      <div className="map-legend">
        <div className="legend-item"><div className="legend-dot dot-critical" /> Critical concern</div>
        <div className="legend-item"><div className="legend-dot dot-high" /> Elevated concern</div>
        <div className="legend-item"><div className="legend-dot dot-notable" /> Notable concern</div>
      </div>
    </div>
  );
}
