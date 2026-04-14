import React from 'react';

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'style'> {
  /** Whether the select has an error state */
  error?: boolean;
  /** Full width select */
  fullWidth?: boolean;
  /** Optional data-testid for testing */
  testId?: string;
  /** Select options */
  children: React.ReactNode;
}

/**
 * Select - Reusable styled select dropdown component.
 * 
 * Provides consistent styling for select dropdowns across the application.
 * Supports all standard HTML select attributes.
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
 * <Select
 *   value={category}
 *   onChange={(e) => setCategory(e.target.value)}
 *   required
 * >
 *   <option value="">Select category</option>
 *   <option value="mental_health">Mental Health</option>
 *   <option value="education">Education</option>
 * </Select>
 * ```
 */
export function Select({
  error = false,
  fullWidth = true,
  testId,
  disabled,
  children,
  ...props
}: SelectProps) {
  return (
    <select
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
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 1rem center',
        paddingRight: '2.5rem',
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
    >
      {children}
    </select>
  );
}
