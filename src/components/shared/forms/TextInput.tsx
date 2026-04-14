import React from 'react';

interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className' | 'style'> {
  /** Whether the input has an error state */
  error?: boolean;
  /** Full width input */
  fullWidth?: boolean;
  /** Optional data-testid for testing */
  testId?: string;
}

/**
 * TextInput - Reusable styled text input component.
 * 
 * Provides consistent styling for text inputs across the application.
 * Supports all standard HTML input attributes.
 * 
 * Features:
 * - Consistent styling
 * - Error state
 * - Focus states
 * - Disabled state
 * - Full width option
 * - Accessible
 * 
 * @example
 * ```tsx
 * <TextInput
 *   type="email"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   placeholder="Enter your email"
 *   required
 * />
 * ```
 */
export function TextInput({
  error = false,
  fullWidth = true,
  testId,
  disabled,
  ...props
}: TextInputProps) {
  return (
    <input
      {...props}
      disabled={disabled}
      data-testid={testId}
      style={{
        width: fullWidth ? '100%' : 'auto',
        borderRadius: '0.75rem',
        padding: '0.625rem 1rem',
        fontSize: '0.9375rem',
        outline: 'none',
        transition: 'all 0.2s ease',
        background: '#fff',
        border: error 
          ? '1px solid var(--admin-danger)' 
          : '1px solid var(--admin-border-strong)',
        color: 'var(--admin-text-primary)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'text',
      }}
      onFocus={(e) => {
        if (!disabled) {
          e.target.style.borderColor = 'var(--admin-primary)';
          e.target.style.boxShadow = '0 0 0 3px var(--admin-primary-light)';
        }
      }}
      onBlur={(e) => {
        e.target.style.borderColor = error 
          ? 'var(--admin-danger)' 
          : 'var(--admin-border-strong)';
        e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
      }}
    />
  );
}
