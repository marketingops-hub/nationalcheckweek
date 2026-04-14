import React from 'react';

interface FormFieldProps {
  /** Field label text */
  label: string;
  /** Optional helper text displayed below the input */
  helperText?: string;
  /** Optional error message */
  error?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Child input element */
  children: React.ReactNode;
  /** Optional HTML id for the input (for label association) */
  htmlFor?: string;
  /** Optional data-testid for testing */
  testId?: string;
}

/**
 * FormField - Reusable form field wrapper component.
 * 
 * Provides consistent styling for form fields with label, helper text,
 * and error message support.
 * 
 * Features:
 * - Accessible label association
 * - Required field indicator
 * - Error state styling
 * - Helper text support
 * - Consistent spacing
 * 
 * @example
 * ```tsx
 * <FormField label="Email" required error={errors.email}>
 *   <input type="email" value={email} onChange={handleChange} />
 * </FormField>
 * ```
 */
export function FormField({
  label,
  helperText,
  error,
  required = false,
  children,
  htmlFor,
  testId,
}: FormFieldProps) {
  return (
    <div className="form-field" style={{ marginBottom: '1.5rem' }} data-testid={testId}>
      <label
        htmlFor={htmlFor}
        className="form-field-label"
        style={{
          display: 'block',
          fontSize: '0.75rem',
          fontWeight: 600,
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--admin-text-subtle)',
        }}
      >
        {label}
        {required && (
          <span
            style={{
              color: 'var(--admin-danger)',
              marginLeft: '0.25rem',
            }}
            aria-label="required"
          >
            *
          </span>
        )}
      </label>
      
      {children}
      
      {helperText && !error && (
        <p
          className="form-field-helper"
          style={{
            fontSize: '0.75rem',
            marginTop: '0.375rem',
            color: 'var(--admin-text-subtle)',
          }}
        >
          {helperText}
        </p>
      )}
      
      {error && (
        <p
          className="form-field-error"
          style={{
            fontSize: '0.75rem',
            marginTop: '0.375rem',
            color: 'var(--admin-danger)',
          }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
