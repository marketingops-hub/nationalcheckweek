"use client";

import ColorPicker from "./ColorPicker";

interface BlockColors {
  useGlobalColors?: boolean;
  primaryButton?: string;
  primaryButtonText?: string;
  secondaryButton?: string;
  secondaryButtonText?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  heading?: string;
  subheading?: string;
}

interface BlockColorOverrideProps {
  colors?: BlockColors;
  onChange: (colors: BlockColors) => void;
  availableColors?: string[]; // Which colors this block type uses
}

const DEFAULT_COLORS: BlockColors = {
  useGlobalColors: true,
  primaryButton: "#29B8E8",
  primaryButtonText: "#FFFFFF",
  secondaryButton: "rgba(255,255,255,0.2)",
  secondaryButtonText: "#FFFFFF",
  accentColor: "#29B8E8",
  backgroundColor: "#FFFFFF",
  textColor: "#1e1b33",
  heading: "#0f0e1a",
  subheading: "#4a4768",
};

const COLOR_LABELS: Record<string, { label: string; description: string }> = {
  primaryButton: { label: "Primary Button", description: "Main CTA button background" },
  primaryButtonText: { label: "Primary Button Text", description: "Text on primary buttons" },
  secondaryButton: { label: "Secondary Button", description: "Secondary CTA background" },
  secondaryButtonText: { label: "Secondary Button Text", description: "Text on secondary buttons" },
  accentColor: { label: "Accent Color", description: "Icons, highlights, stats" },
  backgroundColor: { label: "Background", description: "Block background color" },
  textColor: { label: "Text Color", description: "Body text color" },
  heading: { label: "Heading Color", description: "Main heading color" },
  subheading: { label: "Subheading Color", description: "Subheading/description color" },
};

export default function BlockColorOverride({ 
  colors = DEFAULT_COLORS, 
  onChange,
  availableColors = ['primaryButton', 'accentColor', 'backgroundColor', 'heading', 'subheading']
}: BlockColorOverrideProps) {
  const useGlobal = colors.useGlobalColors !== false;

  function toggleGlobalColors() {
    onChange({
      ...colors,
      useGlobalColors: !useGlobal,
    });
  }

  function updateColor(key: string, value: string) {
    onChange({
      ...colors,
      [key]: value,
    });
  }

  return (
    <div style={{ 
      padding: 16, 
      background: "var(--color-bg-subtle)", 
      border: "1px solid var(--color-border)", 
      borderRadius: 8,
      marginTop: 16 
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle", marginRight: 4 }}>
              palette
            </span>
            Block Colors
          </h4>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>
            {useGlobal 
              ? "Using global color scheme from Global Colors tab" 
              : "Using custom colors for this block only"}
          </p>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
          <input
            type="checkbox"
            checked={useGlobal}
            onChange={toggleGlobalColors}
          />
          Use Global Colors
        </label>
      </div>

      {!useGlobal && (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: 12,
          paddingTop: 12,
          borderTop: "1px solid var(--color-border)"
        }}>
          {availableColors.map((colorKey) => {
            const config = COLOR_LABELS[colorKey];
            if (!config) return null;

            return (
              <ColorPicker
                key={colorKey}
                label={config.label}
                value={colors[colorKey as keyof BlockColors] as string || DEFAULT_COLORS[colorKey as keyof BlockColors] as string}
                onChange={(value) => updateColor(colorKey, value)}
                description={config.description}
              />
            );
          })}
        </div>
      )}

      {useGlobal && (
        <div style={{ 
          padding: 12, 
          background: "var(--color-bg)", 
          borderRadius: 6,
          marginTop: 12,
          fontSize: 13,
          color: "var(--color-text-muted)",
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>info</span>
          <span>
            This block uses colors from the <strong>Global Colors</strong> tab. 
            Uncheck "Use Global Colors" to customize colors for this block only.
          </span>
        </div>
      )}
    </div>
  );
}
