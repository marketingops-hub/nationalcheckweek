"use client";

import React from 'react';
import Link from 'next/link';

interface ActivityItemProps {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  time: string;
  href: string;
}

export const ActivityItem = React.memo(function ActivityItem({
  icon,
  iconBg,
  iconColor,
  title,
  description,
  time,
  href,
}: ActivityItemProps) {
  return (
    <Link href={href} className="swa-activity-item" style={{ textDecoration: 'none' }}>
      <div className="swa-activity-item__icon" style={{ background: iconBg }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: iconColor }}>
          {icon}
        </span>
      </div>
      <div className="swa-activity-item__text">
        <strong>{title}:</strong> {description}
      </div>
      <div className="swa-activity-item__time">
        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>schedule</span>
        {time}
      </div>
    </Link>
  );
});
