import React from 'react';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  /** Alert variant */
  variant: AlertVariant;
  /** Alert message */
  message: string;
  /** Optional callback when alert is dismissed */
  onDismiss?: () => void;
  /** Optional data-testid for testing */
  testId?: string;
}

const VARIANT_STYLES: Record<AlertVariant, {
  background: string;
  border: string;
  color: string;
  icon: string;
}> = {
  success: {
    background: 'var(--admin-success-light)',
    border: 'var(--admin-success)',
    color: 'var(--admin-success-dark)',
    icon: '✓',
  },
  error: {
    background: 'var(--admin-danger-light)',
    border: 'var(--admin-danger)',
    color: 'var(--admin-danger-dark)',
    icon: '✕',
  },
  warning: {
    background: 'var(--admin-warning-light)',
    border: 'var(--admin-warning)',
    color: 'var(--admin-warning-dark)',
    icon: '⚠',
  },
  info: {
    background: 'var(--admin-info-light)',
    border: 'var(--admin-info)',
    color: 'var(--admin-info-dark)',
    icon: 'ℹ',
  },
};

/**
 * Alert - Reusable alert/message component.
 * 
 * Displays success, error, warning, or info messages with
 * consistent styling and optional dismiss functionality.
 * 
 * Features:
 * - Multiple variants (success, error, warning, info)
 * - Icon indicators
 * - Dismissible
 * - Accessible (role="alert")
 * - Consistent styling
 * 
 * @example
 * ```tsx
 * <Alert
 *   variant="success"
 *   message="Source created successfully!"
 *   onDismiss={() => setShowAlert(false)}
 * />
 * ```
 */
export function Alert({
  variant,
  message,
  onDismiss,
  testId,
}: AlertProps) {
  const styles = VARIANT_STYLES[variant];
  
  return (
    <div
      role="alert"
      data-testid={testId}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.875rem 1rem',
        borderRadius: '0.5rem',
        background: styles.background,
        border: `1px solid ${styles.border}`,
        color: styles.color,
        fontSize: '0.875rem',
        fontWeight: 500,
        marginBottom: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span
          style={{
            fontSize: '1.125rem',
            fontWeight: 700,
          }}
          aria-hidden="true"
        >
          {styles.icon}
        </span>
        <span>{message}</span>
      </div>
      
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss alert"
          style={{
            background: 'transparent',
            border: 'none',
            color: styles.color,
            cursor: 'pointer',
            padding: '0.25rem',
            fontSize: '1.25rem',
            lineHeight: 1,
            opacity: 0.7,
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.opacity = '0.7';
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
