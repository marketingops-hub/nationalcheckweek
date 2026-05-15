"use client";

import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '60px 20px',
        maxWidth: '400px',
        margin: '0 auto',
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: 64,
          color: '#d1d5db',
          display: 'block',
          marginBottom: '16px',
        }}
      >
        {icon}
      </span>
      <h3
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#1e1040',
          marginBottom: '8px',
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '24px',
            lineHeight: '1.5',
          }}
        >
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          {action && (
            <Button
              variant="primary"
              onClick={action.onClick}
              href={action.href}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="secondary"
              onClick={secondaryAction.onClick}
              href={secondaryAction.href}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
