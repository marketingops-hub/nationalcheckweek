import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'style'> {
  /** Button variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Loading state */
  loading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Optional data-testid for testing */
  testId?: string;
  /** Button content */
  children: React.ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--admin-primary)',
    color: '#fff',
    border: '1px solid var(--admin-primary)',
  },
  secondary: {
    background: '#fff',
    color: 'var(--admin-primary)',
    border: '1px solid var(--admin-border-strong)',
  },
  danger: {
    background: 'var(--admin-danger)',
    color: '#fff',
    border: '1px solid var(--admin-danger)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--admin-text-primary)',
    border: '1px solid transparent',
  },
};

const SIZE_STYLES: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    padding: '0.375rem 0.75rem',
    fontSize: '0.8125rem',
  },
  md: {
    padding: '0.625rem 1.25rem',
    fontSize: '0.9375rem',
  },
  lg: {
    padding: '0.875rem 1.75rem',
    fontSize: '1rem',
  },
};

/**
 * Button - Reusable button component with variants and loading states.
 * 
 * Provides consistent button styling across the application with
 * support for different variants, sizes, and states.
 * 
 * Features:
 * - Multiple variants (primary, secondary, danger, ghost)
 * - Multiple sizes (sm, md, lg)
 * - Loading state with spinner
 * - Disabled state
 * - Full width option
 * - Accessible
 * - Hover/focus states
 * 
 * @example
 * ```tsx
 * <Button
 *   variant="primary"
 *   loading={isSubmitting}
 *   onClick={handleSubmit}
 * >
 *   Save Changes
 * </Button>
 * ```
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  testId,
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  
  return (
    <button
      {...props}
      type={type}
      disabled={isDisabled}
      data-testid={testId}
      style={{
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
        width: fullWidth ? '100%' : 'auto',
        borderRadius: '0.5rem',
        fontWeight: 600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          const target = e.target as HTMLButtonElement;
          if (variant === 'primary') {
            target.style.background = 'var(--admin-primary-dark)';
          } else if (variant === 'secondary') {
            target.style.background = 'var(--admin-bg-elevated)';
          } else if (variant === 'danger') {
            target.style.background = 'var(--admin-danger-dark)';
          } else if (variant === 'ghost') {
            target.style.background = 'var(--admin-bg-elevated)';
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          const target = e.target as HTMLButtonElement;
          target.style.background = VARIANT_STYLES[variant].background as string;
        }
      }}
      onFocus={(e) => {
        if (!isDisabled) {
          e.target.style.boxShadow = '0 0 0 3px var(--admin-primary-light)';
        }
      }}
      onBlur={(e) => {
        e.target.style.boxShadow = 'none';
      }}
    >
      {loading && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            animation: 'spin 1s linear infinite',
          }}
        >
          <circle
            cx="8"
            cy="8"
            r="6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="32"
            strokeDashoffset="8"
            opacity="0.25"
          />
          <circle
            cx="8"
            cy="8"
            r="6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="32"
            strokeDashoffset="8"
          />
        </svg>
      )}
      {children}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </button>
  );
}
