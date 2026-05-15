import React from 'react';
import { FormGroup } from './FormGroup';

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  type?: 'text' | 'email' | 'url' | 'number';
  maxLength?: number;
}

export function TextInput({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  required, 
  helpText,
  type = 'text',
  maxLength
}: TextInputProps) {
  return (
    <FormGroup label={label} required={required} helpText={helpText}>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="swa-input"
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
      />
    </FormGroup>
  );
}
