export const ANALYTICS_PERIODS = ['all', '7d', '30d', '90d', '180d'] as const;

export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export const DEFAULT_ANALYTICS_PERIOD: AnalyticsPeriod = 'all';
