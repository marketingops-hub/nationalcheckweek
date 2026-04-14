/**
 * Stats Block Editor Component
 * 
 * Provides editing interface for statistics display with value/label pairs.
 * Supports multiple stat cards with dynamic add/remove functionality.
 * 
 * @component
 */

import React from "react";
import type { StatsBlockContent } from "@/types/homepage-blocks";
import { ColorPicker } from "@/components/admin/forms";
import { useBlockColors } from "@/hooks/admin/useBlockColors";

interface StatsBlockEditorProps {
  content: StatsBlockContent;
  onChange: (key: string, value: unknown) => void;
}

export const StatsBlockEditor: React.FC<StatsBlockEditorProps> = ({ content, onChange }) => {
  const stats = content.stats || [];
  const colors = content.colors || {};
  const { handleColorChange } = useBlockColors(colors, onChange);

  const updateStat = (index: number, field: string, value: string) => {
    const newStats = [...stats];
    newStats[index] = { ...newStats[index], [field]: value };
    onChange("stats", newStats);
  };

  const addStat = () => {
    onChange("stats", [...stats, { value: "", label: "" }]);
  };

  const removeStat = (index: number) => {
    onChange("stats", stats.filter((_, i) => i !== index));
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Statistics</h3>
        <button 
          onClick={addStat}
          className="swa-btn"
          type="button"
          style={{ fontSize: 13, padding: "6px 12px" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          Add Stat
        </button>
      </div>

      {stats.length === 0 && (
        <div style={{ 
          padding: 24, 
          textAlign: "center", 
          background: "var(--color-bg-subtle)", 
          borderRadius: 6,
          color: "var(--color-text-muted)"
        }}>
          No statistics yet. Click "Add Stat" to create one.
        </div>
      )}

      {stats.map((stat, index) => (
        <div 
          key={index} 
          style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 2fr auto", 
            gap: 12, 
            padding: 12, 
            background: "var(--color-bg-subtle)", 
            borderRadius: 6,
            marginBottom: 12,
            alignItems: "center"
          }}
        >
          <div>
            <label className="swa-label" style={{ fontSize: 12, marginBottom: 4 }}>Value</label>
            <input
              type="text"
              value={stat.value || ""}
              onChange={(e) => updateStat(index, "value", e.target.value)}
              placeholder="1,200+"
              className="swa-input"
            />
          </div>
          <div>
            <label className="swa-label" style={{ fontSize: 12, marginBottom: 4 }}>Label</label>
            <input
              type="text"
              value={stat.label || ""}
              onChange={(e) => updateStat(index, "label", e.target.value)}
              placeholder="Schools Participating"
              className="swa-input"
            />
          </div>
          <button
            onClick={() => removeStat(index)}
            className="swa-icon-btn"
            type="button"
            style={{ color: "#EF4444", marginTop: 20 }}
            title="Remove stat"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
          </button>
        </div>
      ))}

      {/* Color Customization Section */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '2px solid var(--color-border)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>palette</span>
          Colors
        </h3>

        <div style={{ display: 'grid', gap: 16 }}>
          <ColorPicker
            label="Accent Color (for stat values)"
            value={colors.accentColor || '#29B8E8'}
            onChange={(value) => handleColorChange('accentColor', value)}
          />
        </div>
      </div>
    </>
  );
};
