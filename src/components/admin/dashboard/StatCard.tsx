"use client";

import React from 'react';
import Link from 'next/link';

interface StatCardProps {
  label: string;
  value: string | number;
  badge?: {
    text: string;
    variant: 'success' | 'primary' | 'warning' | 'danger';
  };
  delta?: string;
  href?: string;
}

export const StatCard = React.memo(function StatCard({
  label,
  value,
  badge,
  delta,
  href,
}: StatCardProps) {
  const content = (
    <>
      <div className="swa-stat-card__top">
        <span className="swa-stat-card__label">{label}</span>
        {badge && (
          <span className={`swa-badge swa-badge--${badge.variant}`}>
            {badge.text}
          </span>
        )}
      </div>
      <div className="swa-stat-card__value">{value}</div>
      {delta && (
        <div className="swa-stat-card__bottom">
          <span className="swa-stat-card__delta">{delta}</span>
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="swa-stat-card">
        {content}
      </Link>
    );
  }

  return <div className="swa-stat-card">{content}</div>;
});
