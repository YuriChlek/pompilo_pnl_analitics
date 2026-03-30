import type { TradingAccountAnalyticsPeriod } from '@/features/module-trading-account/interfaces/tradingAccount';

export const DEFAULT_TRADING_ACCOUNT_ANALYTICS_PERIOD: TradingAccountAnalyticsPeriod = 'all';

export const TRADING_ACCOUNT_ANALYTICS_PERIOD_OPTIONS: Array<{
    label: string;
    value: TradingAccountAnalyticsPeriod;
}> = [
    { label: 'All', value: 'all' },
    { label: '7d', value: '7d' },
    { label: '30d', value: '30d' },
    { label: '90d', value: '90d' },
    { label: '180d', value: '180d' },
];

export const TRADING_ACCOUNT_ANALYTICS_PERIOD_VALUES = TRADING_ACCOUNT_ANALYTICS_PERIOD_OPTIONS.map(
    option => option.value,
);
