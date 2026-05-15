"use client";

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for typography editor
 * Catches React errors and displays user-friendly message
 */
export class TypographyErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Typography editor error:', error, errorInfo);
    // TODO: Send to error monitoring service (e.g., Sentry)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="swa-card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ marginBottom: 24 }}>
            <span 
              className="material-symbols-outlined" 
              style={{ fontSize: 64, color: '#EF4444', display: 'block', marginBottom: 16 }}
            >
              error
            </span>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--color-text-primary)' }}>
              Something went wrong
            </h2>
            <p style={{ color: 'var(--color-text-faint)', marginBottom: 24 }}>
              The typography editor encountered an unexpected error.
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div 
              style={{ 
                background: '#FEE2E2', 
                border: '1px solid #EF4444', 
                borderRadius: 8, 
                padding: 16, 
                marginBottom: 24,
                textAlign: 'left',
                fontSize: 13,
                fontFamily: 'monospace'
              }}
            >
              <strong>Error:</strong> {this.state.error.message}
              {this.state.error.stack && (
                <pre style={{ marginTop: 8, fontSize: 11, overflow: 'auto' }}>
                  {this.state.error.stack}
                </pre>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={this.handleReset}
              className="swa-btn swa-btn--primary"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                refresh
              </span>
              Reload Page
            </button>
            <a
              href="/admin"
              className="swa-btn swa-btn--secondary"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                home
              </span>
              Back to Dashboard
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
