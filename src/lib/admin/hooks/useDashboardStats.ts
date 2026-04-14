"use client";

import useSWR from 'swr';
import { adminSWRConfig } from '../swr-config';

interface DashboardStats {
  counts: {
    issues: number;
    states: number;
    areas: number;
    events: number;
    publishedEvents: number;
    seoMissing: number;
    schools: number;
  };
  activity: {
    issues: Array<{ id: string; title: string; updated_at: string }>;
    areas: Array<{ id: string; name: string; state: string; updated_at: string }>;
    events: Array<{ id: string; title: string; updated_at: string }>;
  };
  timestamp: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
};

export function useDashboardStats() {
  const { data, error, isLoading, mutate } = useSWR<DashboardStats>(
    '/api/admin/dashboard/stats',
    fetcher,
    adminSWRConfig
  );

  return {
    stats: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
