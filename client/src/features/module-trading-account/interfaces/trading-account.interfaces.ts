import type { TradingAccountAnalyticsPeriod } from '@/features/module-trading-account/types/analytics-period.types';

export interface TradingAccountPayload {
    tradingAccountName: string;
    apiKeyId: string;
    exchange: string;
    market: string;
}

export interface TradingAccount {
    id: string;
    tradingAccountName: string;
    apiKeyId: string | null;
    apiKey: {
        apiKeyName: string;
    } | null;
    exchange: string;
    market: string;
}

export interface TradingAccountStatistic {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalClosedPnl: number;
    grossProfit: number;
    grossLoss: number;
    averageClosedPnl: number;
    bestTrade: number | null;
    worstTrade: number | null;
    profitFactor: number | null;
    latestTradeAt: string | null;
}

export interface TradingAccountChartPoint {
    time: string;
    cumulativeClosedPnl: number;
}

export interface TradingAccountRecentTrade {
    id: string;
    symbol: string;
    side: 'Buy' | 'Sell';
    closedPnl: number;
    qty: number;
    avgEntryPrice: number;
    avgExitPrice: number;
    leverage: number;
    createdTime: string | null;
    updatedTime: string | null;
    orderType: string;
}

export interface TradingAccountRecentTradePage {
    items: TradingAccountRecentTrade[];
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

export interface TradingAccountDetails {
    account: TradingAccount;
    statistics: TradingAccountStatistic;
    chart: TradingAccountChartPoint[];
}

export interface TradingAccountSettingsPopupProps {
    account: TradingAccount;
    open: boolean;
    onClose: () => void;
}

export interface TradingAccountFormPopupProps {
    open: boolean;
    title: string;
    submitLabel: string;
    initialData: TradingAccountPayload;
    currentTradingAccountId?: string;
    onClose: () => void;
    onSubmit: (payload: TradingAccountPayload) => void;
    isPending?: boolean;
}

export interface TradingAccountService {
    createTradingAccount: (tradingAccountPayload: TradingAccountPayload) => Promise<TradingAccount>;
    removeTradingAccount: (id: string) => Promise<boolean>;
    editTradingAccount: (
        id: string,
        tradingAccountPayload: TradingAccountPayload,
    ) => Promise<TradingAccount | null>;
    getTradingAccountList: () => Promise<TradingAccount[]>;
    getTradingAccountDetails: (
        id: string,
        period: TradingAccountAnalyticsPeriod,
    ) => Promise<TradingAccountDetails>;
    getTradingAccountTrades: (
        id: string,
        page: number,
        pageSize: number,
        period: TradingAccountAnalyticsPeriod,
    ) => Promise<TradingAccountRecentTradePage>;
}
