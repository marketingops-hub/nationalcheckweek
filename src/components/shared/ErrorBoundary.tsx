"use client";

import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Optional fallback UI */
  fallback?: ReactNode;
  /** Optional error callback */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary - Catches JavaScript errors in child components.
 * 
 * Prevents entire app from crashing when a component throws an error.
 * Displays fallback UI and logs error for debugging.
 * 
 * Features:
 * - Catches errors in child components
 * - Displays fallback UI
 * - Logs errors for debugging
 * - Optional error callback
 * - Reset functionality
 * 
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: '2rem',
            borderRadius: '0.5rem',
            background: 'var(--admin-danger-light)',
            border: '1px solid var(--admin-danger)',
            color: 'var(--admin-danger-dark)',
          }}
          role="alert"
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: '0.375rem',
              background: 'var(--admin-danger)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Default error fallback component
 */
export function ErrorFallback({ error }: { error?: Error }) {
  return (
    <div
      style={{
        padding: '3rem 2rem',
        textAlign: 'center',
        borderRadius: '0.5rem',
        background: 'var(--admin-bg-elevated)',
        border: '1px solid var(--admin-border)',
      }}
    >
      <div
        style={{
          fontSize: '3rem',
          marginBottom: '1rem',
        }}
      >
        ⚠️
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        Something went wrong
      </h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--admin-text-subtle)', marginBottom: '1.5rem' }}>
        {error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: '0.625rem 1.25rem',
          fontSize: '0.9375rem',
          fontWeight: 600,
          borderRadius: '0.5rem',
          background: 'var(--admin-primary)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Refresh Page
      </button>
    </div>
  );
}
