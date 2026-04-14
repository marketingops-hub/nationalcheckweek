import React from 'react';
import { FormGroup } from './FormGroup';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  helpText?: string;
}

export function ColorPicker({ label, value, onChange, required, helpText }: ColorPickerProps) {
  return (
    <FormGroup label={label} required={required} helpText={helpText}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="swa-color-input"
          style={{
            width: '60px',
            height: '40px',
            border: '1px solid #e4e2ec',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="swa-input"
          placeholder="#000000"
          pattern="^#[0-9A-Fa-f]{6}$"
          style={{ flex: 1 }}
        />
      </div>
    </FormGroup>
  );
}
