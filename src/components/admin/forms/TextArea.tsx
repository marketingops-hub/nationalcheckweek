import React from 'react';
import { FormGroup } from './FormGroup';

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  rows?: number;
}

export function TextArea({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  required, 
  helpText,
  rows = 4
}: TextAreaProps) {
  return (
    <FormGroup label={label} required={required} helpText={helpText}>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="swa-textarea"
        placeholder={placeholder}
        required={required}
        rows={rows}
      />
    </FormGroup>
  );
}
