import React from 'react';

interface FormGroupProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  helpText?: string;
}

export function FormGroup({ label, children, error, required, helpText }: FormGroupProps) {
  return (
    <div className="swa-form-group">
      <label className="swa-label">
        {label}
        {required && <span style={{ color: '#e74c3c', marginLeft: '4px' }}>*</span>}
      </label>
      {helpText && (
        <p style={{ fontSize: '0.875rem', color: '#7b78a0', marginBottom: '8px' }}>
          {helpText}
        </p>
      )}
      {children}
      {error && <span className="swa-error">{error}</span>}
    </div>
  );
}
