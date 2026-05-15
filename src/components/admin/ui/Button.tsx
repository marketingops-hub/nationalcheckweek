"use client";

import React from 'react';
import Link from 'next/link';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  loading?: boolean;
  href?: string;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      icon,
      loading = false,
      href,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) {
    const baseClass = 'swa-btn';
    const variantClass = variant !== 'primary' ? `swa-btn--${variant}` : '';
    const sizeClass = size === 'sm' ? 'swa-btn--sm' : size === 'lg' ? 'swa-btn--lg' : '';
    const classes = [baseClass, variantClass, sizeClass, className].filter(Boolean).join(' ');

    const content = (
      <>
        {loading && (
          <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>
            progress_activity
          </span>
        )}
        {!loading && icon && (
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            {icon}
          </span>
        )}
        {children}
      </>
    );

    if (href) {
      return (
        <Link href={href} className={classes}>
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {content}
      </button>
    );
  }
);
