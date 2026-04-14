import { SWRConfiguration } from 'swr';

export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60000, // 1 minute
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  shouldRetryOnError: true,
  focusThrottleInterval: 5000,
};

export const adminSWRConfig: SWRConfiguration = {
  ...swrConfig,
  refreshInterval: 300000, // 5 minutes for admin data
  revalidateIfStale: true,
  keepPreviousData: true,
};
