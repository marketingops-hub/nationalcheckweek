"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useDashboardStats } from '@/lib/admin/hooks/useDashboardStats';
import { StatCard } from './StatCard';
import { ActivityItem } from './ActivityItem';
import { StatCardSkeleton, ActivityItemSkeleton } from '../ui/Skeleton';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function DashboardClient({ userEmail, today }: { userEmail: string; today: string }) {
  const { stats, isLoading, isError } = useDashboardStats();

  if (isError) {
    return (
      <div className="swa-alert swa-alert--error" style={{ marginBottom: 20 }}>
        Could not load dashboard data — check your Supabase connection.
      </div>
    );
  }

  const counts = stats?.counts || {
    issues: 0,
    states: 0,
    areas: 0,
    events: 0,
    publishedEvents: 0,
    seoMissing: 0,
    schools: 0,
  };

  const activity = stats?.activity || { issues: [], areas: [], events: [] };

  // Build activity feed
  type ActivityRow = { icon: string; iconBg: string; iconColor: string; title: string; description: string; time: string; href: string };
  const activityRows: ActivityRow[] = [
    ...(activity.issues || []).map(r => ({
      icon: 'warning',
      iconBg: '#fef3c7',
      iconColor: '#d97706',
      title: 'Issue updated',
      description: r.title || '—',
      time: timeAgo(r.updated_at),
      href: `/admin/issues/${r.id}`,
      _ts: r.updated_at,
    })),
    ...(activity.areas || []).map(r => ({
      icon: 'location_on',
      iconBg: '#ede9fe',
      iconColor: '#7c3aed',
      title: 'Area updated',
      description: `${r.name || '—'}, ${r.state || ''}`,
      time: timeAgo(r.updated_at),
      href: `/admin/content/${r.id}`,
      _ts: r.updated_at,
    })),
    ...(activity.events || []).map(r => ({
      icon: 'event',
      iconBg: '#e0f2fe',
      iconColor: '#0284c7',
      title: 'Event updated',
      description: r.title || '—',
      time: timeAgo(r.updated_at),
      href: `/admin/events/${r.id}`,
      _ts: r.updated_at,
    })),
  ];

  activityRows.sort((a: any, b: any) => b._ts.localeCompare(a._ts));
  const recentActivity = activityRows.slice(0, 6);

  const seoHealthPct = counts.areas > 0 ? Math.round(((counts.areas - counts.seoMissing) / counts.areas) * 100) : 100;
  const circumference = 2 * Math.PI * 54;

  const QUICK_ACTIONS = [
    { label: 'Manage Issues', href: '/admin/issues', icon: 'warning' },
    { label: 'Schools', href: '/admin/schools', icon: 'school' },
    { label: 'Events', href: '/admin/events', icon: 'event' },
    { label: 'Areas & Cities', href: '/admin/content', icon: 'location_on' },
    { label: 'SEO Manager', href: '/admin/seo', icon: 'travel_explore' },
    { label: 'CMS Pages', href: '/admin/cms/pages', icon: 'article' },
    { label: 'API Keys', href: '/admin/api', icon: 'key' },
  ];

  return (
    <>
      {/* Page Header */}
      <motion.div
        className="swa-page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="swa-page-title">Dashboard</h1>
          <p className="swa-page-subtitle">{today} · {userEmail || 'National Check-in Week'}</p>
        </div>
        <Link href="/admin/events/new" className="swa-btn swa-btn--primary" style={{ textDecoration: 'none' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          New Event
        </Link>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        className="swa-stat-grid"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <motion.div variants={item}>
              <StatCard
                label="Wellbeing Issues"
                value={counts.issues}
                badge={{ text: 'Live', variant: 'success' }}
                delta={`${counts.states} states covered`}
                href="/admin/issues"
              />
            </motion.div>

            <motion.div variants={item}>
              <StatCard
                label="Events"
                value={counts.events}
                badge={{ text: `${counts.publishedEvents} published`, variant: 'primary' }}
                delta={`${counts.events - counts.publishedEvents} drafts`}
                href="/admin/events"
              />
            </motion.div>

            <motion.div variants={item}>
              <StatCard
                label="Areas & Cities"
                value={counts.areas}
                badge={{ text: `${counts.seoMissing} need SEO`, variant: 'warning' }}
                delta={`${counts.states} states`}
                href="/admin/content"
              />
            </motion.div>

            <motion.div variants={item}>
              <StatCard
                label="Schools"
                value={counts.schools.toLocaleString()}
                badge={{ text: 'ACARA', variant: 'primary' }}
                delta="All Australian schools"
                href="/admin/schools"
              />
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Two-column: Activity + Right panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, marginTop: 24 }}>
        {/* Recent Activity */}
        <motion.div
          className="swa-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="swa-card__header">
            <span className="swa-card__title">Recent Activity</span>
            <Link href="/admin/content" className="swa-btn-ghost" style={{ fontSize: 12 }}>View areas →</Link>
          </div>
          {isLoading ? (
            <div>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <ActivityItemSkeleton key={i} />
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--color-text-faint)', padding: '16px 0' }}>No recent activity.</p>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show">
              {recentActivity.map((a, index) => (
                <motion.div key={`${a.href}-${index}`} variants={item}>
                  <ActivityItem
                    icon={a.icon}
                    iconBg={a.iconBg}
                    iconColor={a.iconColor}
                    title={a.title}
                    description={a.description}
                    time={a.time}
                    href={a.href}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* SEO Coverage ring */}
          <motion.div
            className="swa-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="swa-card__header">
              <span className="swa-card__title">SEO Coverage</span>
              <Link href="/admin/seo" className="swa-btn-ghost" style={{ fontSize: 12 }}>Fix →</Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '8px 0' }}>
              <svg width="80" height="80" viewBox="0 0 140 140" style={{ flexShrink: 0 }}>
                <circle cx="70" cy="70" r="54" fill="none" stroke="#ede9fe" strokeWidth="12"/>
                <motion.circle
                  cx="70"
                  cy="70"
                  r="54"
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference}
                  strokeLinecap="round"
                  transform="rotate(-90 70 70)"
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: circumference - (seoHealthPct / 100) * circumference }}
                  transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                />
                <text x="70" y="67" textAnchor="middle" fontSize="26" fontWeight="700" fill="#1e1040">{seoHealthPct}%</text>
                <text x="70" y="85" textAnchor="middle" fontSize="10" fill="#9ca3af" letterSpacing="1">AREAS</text>
              </svg>
              <div>
                <div style={{ fontSize: 13, color: 'var(--color-text-body)', marginBottom: 6 }}>
                  <strong>{counts.areas - counts.seoMissing}</strong> of {counts.areas} areas have SEO metadata
                </div>
                {counts.seoMissing > 0 && (
                  <Link href="/admin/seo" className="swa-btn swa-btn--primary" style={{ fontSize: 12, padding: '5px 12px', textDecoration: 'none', display: 'inline-flex' }}>
                    ✨ Generate {counts.seoMissing} missing
                  </Link>
                )}
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            className="swa-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-faint)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 12 }}>QUICK ACTIONS</div>
            <motion.div variants={container} initial="hidden" animate="show">
              {QUICK_ACTIONS.map((a, index) => (
                <motion.div key={a.href} variants={item}>
                  <Link href={a.href} className="swa-quick-action">
                    <div className="swa-quick-action__icon">
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{a.icon}</span>
                    </div>
                    <span className="swa-quick-action__label">{a.label}</span>
                    <span className="material-symbols-outlined swa-quick-action__chevron" style={{ fontSize: 14 }}>chevron_right</span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
