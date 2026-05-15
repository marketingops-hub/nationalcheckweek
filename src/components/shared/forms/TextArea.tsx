import React from 'react';

interface TextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className' | 'style'> {
  /** Whether the textarea has an error state */
  error?: boolean;
  /** Full width textarea */
  fullWidth?: boolean;
  /** Optional data-testid for testing */
  testId?: string;
}

/**
 * TextArea - Reusable styled textarea component.
 * 
 * Provides consistent styling for textareas across the application.
 * Supports all standard HTML textarea attributes.
 * 
 * Features:
 * - Consistent styling
 * - Error state
 * - Focus states
 * - Disabled state
 * - Resizable
 * - Full width option
 * - Accessible
 * 
 * @example
 * ```tsx
 * <TextArea
 *   value={description}
 *   onChange={(e) => setDescription(e.target.value)}
 *   placeholder="Enter description"
 *   rows={4}
 * />
 * ```
 */
export function TextArea({
  error = false,
  fullWidth = true,
  testId,
  disabled,
  rows = 3,
  ...props
}: TextAreaProps) {
  return (
    <textarea
      {...props}
      rows={rows}
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
        resize: 'vertical',
        fontFamily: 'inherit',
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
