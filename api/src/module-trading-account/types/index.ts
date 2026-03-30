import {
    ClosedPnlStatistics,
    ClosedPnlTimelinePoint,
} from '@/module-trades/types/trades.repository.types';

export type TradingAccountApiKeySummary = {
    id: string;
    apiKeyName: string;
};

export type TradingAccountSummary = {
    id: string;
    tradingAccountName: string;
    exchange: string;
    market: string;
    apiKeyId: string | null;
    apiKey: Pick<TradingAccountApiKeySummary, 'apiKeyName'> | null;
};

export type TradingAccountPageData = {
    account: TradingAccountSummary;
    statistics: ClosedPnlStatistics;
    chart: ClosedPnlTimelinePoint[];
};
