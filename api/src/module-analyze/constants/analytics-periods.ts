import type { AnalyticsPeriod } from '@/module-analyze/types/analytics-period.types';

export const ANALYTICS_PERIODS = ['all', '7d', '30d', '90d', '180d'] as const;

export const DEFAULT_ANALYTICS_PERIOD: AnalyticsPeriod = 'all';
