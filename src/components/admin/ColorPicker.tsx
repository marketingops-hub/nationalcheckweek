"use client";

import { useState, useRef, useEffect } from "react";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  description?: string;
}

export default function ColorPicker({ label, value, onChange, description }: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempColor, setTempColor] = useState(value || "#000000");
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) setTempColor(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    }

    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showPicker]);

  const handleColorChange = (newColor: string) => {
    setTempColor(newColor);
    onChange(newColor);
  };

  const presetColors = [
    "#29B8E8", // Cyan
    "#0B1D35", // Dark Blue
    "#475569", // Slate
    "#FFFFFF", // White
    "#000000", // Black
    "#E50E7E", // Pink
    "#A78BFA", // Purple
    "#10B981", // Green
    "#F59E0B", // Orange
    "#EF4444", // Red
  ];

  return (
    <div className="swa-form-group">
      <label className="swa-label">
        {label}
        {description && <span className="swa-label-hint">{description}</span>}
      </label>
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "8px",
              border: "2px solid var(--color-border)",
              backgroundColor: tempColor || "#FFFFFF",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            title="Click to pick a color"
          />
          <input
            type="text"
            value={tempColor || ""}
            onChange={(e) => handleColorChange(e.target.value)}
            placeholder="#000000"
            className="swa-input"
            style={{ flex: 1, fontFamily: "monospace" }}
          />
        </div>

        {showPicker && (
          <div
            ref={pickerRef}
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: "0.5rem",
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              padding: "1rem",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              zIndex: 1000,
              minWidth: "280px",
            }}
          >
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--color-text-muted)" }}>
                Pick a Color
              </label>
              <input
                type="color"
                value={tempColor || "#000000"}
                onChange={(e) => handleColorChange(e.target.value)}
                style={{
                  width: "100%",
                  height: "120px",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--color-text-muted)" }}>
                Preset Colors
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem" }}>
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorChange(color)}
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "6px",
                      border: tempColor === color ? "3px solid var(--color-primary)" : "2px solid var(--color-border)",
                      backgroundColor: color,
                      cursor: "pointer",
                      transition: "transform 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--color-text-muted)" }}>
                Hex Code
              </label>
              <input
                type="text"
                value={tempColor || ""}
                onChange={(e) => handleColorChange(e.target.value)}
                placeholder="#000000"
                className="swa-input"
                style={{ fontFamily: "monospace", fontSize: "0.875rem" }}
              />
            </div>

            <div style={{ marginTop: "1rem", padding: "0.75rem", backgroundColor: "var(--color-bg-subtle)", borderRadius: "6px", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>Preview</div>
              <div
                style={{
                  width: "100%",
                  height: "60px",
                  backgroundColor: tempColor || "#FFFFFF",
                  borderRadius: "6px",
                  border: "1px solid var(--color-border)",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
