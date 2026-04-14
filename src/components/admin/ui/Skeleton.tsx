import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
  style?: React.CSSProperties;
}

export function Skeleton({
  className = '',
  width,
  height,
  variant = 'text',
  animation = 'pulse',
  style,
}: SkeletonProps) {
  const baseStyles: React.CSSProperties = {
    backgroundColor: '#e5e7eb',
    borderRadius: variant === 'circular' ? '50%' : variant === 'text' ? '4px' : '8px',
    width: width || '100%',
    height: height || (variant === 'text' ? '1em' : variant === 'circular' ? '40px' : '100%'),
    ...style,
  };

  const animationClass = animation === 'pulse' ? 'skeleton-pulse' : animation === 'wave' ? 'skeleton-wave' : '';

  return (
    <div
      className={`${animationClass} ${className}`}
      style={baseStyles}
      aria-hidden="true"
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="swa-stat-card" style={{ pointerEvents: 'none' }}>
      <div className="swa-stat-card__top">
        <Skeleton width="60%" height="14px" />
        <Skeleton width="50px" height="20px" />
      </div>
      <div className="swa-stat-card__value">
        <Skeleton width="80px" height="36px" />
      </div>
      <div className="swa-stat-card__bottom">
        <Skeleton width="70%" height="12px" />
      </div>
    </div>
  );
}

export function ActivityItemSkeleton() {
  return (
    <div className="swa-activity-item" style={{ pointerEvents: 'none' }}>
      <div className="swa-activity-item__icon">
        <Skeleton variant="circular" width="32px" height="32px" />
      </div>
      <div className="swa-activity-item__text" style={{ flex: 1 }}>
        <Skeleton width="80%" height="14px" style={{ marginBottom: '4px' }} />
        <Skeleton width="60%" height="12px" />
      </div>
      <div className="swa-activity-item__time">
        <Skeleton width="40px" height="12px" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div style={{ width: '100%' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '16px', padding: '12px 0', borderBottom: '1px solid #e5e7eb' }}>
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} width={j === 0 ? '40%' : '20%'} height="16px" />
          ))}
        </div>
      ))}
    </div>
  );
}
