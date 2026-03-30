import type {
    TradingAccountDetails,
    TradingAccountRecentTrade,
    TradingAccountRecentTradePage,
    TradingAccountAnalyticsPeriod,
} from '@/features/module-trading-account/interfaces/tradingAccount';

export const buildTradingAccountDetails = (
    overrides: Partial<TradingAccountDetails> = {},
): TradingAccountDetails => ({
    account: {
        id: 'account-id',
        tradingAccountName: 'main account',
        exchange: 'bybit',
        market: 'futures',
        apiKeyId: 'api-key-id',
        apiKey: {
            apiKeyName: 'Primary key',
        },
    },
    statistics: {
        totalTrades: 12,
        winningTrades: 8,
        losingTrades: 4,
        winRate: 66.6,
        totalClosedPnl: 100,
        grossProfit: 140,
        grossLoss: -40,
        averageClosedPnl: 8.3,
        bestTrade: 40,
        worstTrade: -20,
        profitFactor: 3.5,
        latestTradeAt: '2026-03-30T12:00:00.000Z',
    },
    chart: [{ time: '2026-03-30T12:00:00.000Z', cumulativeClosedPnl: 100 }],
    ...overrides,
});

export const buildRecentTrade = (
    overrides: Partial<TradingAccountRecentTrade> = {},
): TradingAccountRecentTrade => ({
    id: 'trade-1',
    symbol: 'BTCUSDT',
    side: 'Buy',
    closedPnl: 10,
    qty: 1,
    avgEntryPrice: 100,
    avgExitPrice: 110,
    leverage: 5,
    createdTime: '2026-03-30T12:00:00.000Z',
    updatedTime: '2026-03-30T12:05:00.000Z',
    orderType: 'Market',
    ...overrides,
});

export const buildRecentTradePage = (
    overrides: Partial<TradingAccountRecentTradePage> = {},
): TradingAccountRecentTradePage => ({
    items: [buildRecentTrade()],
    page: 1,
    pageSize: 10,
    totalItems: 1,
    totalPages: 1,
    ...overrides,
});

export const buildPagedTradeData = (
    period: TradingAccountAnalyticsPeriod,
    page: number,
    pageSize: number,
): TradingAccountRecentTradePage => {
    const pageOneTrade = buildRecentTrade({
        id: `${period}-page-1`,
        symbol: 'BTCUSDT',
    });
    const pageTwoTrade = buildRecentTrade({
        id: `${period}-page-2`,
        symbol: 'ETHUSDT',
        closedPnl: 20,
    });

    return {
        items: page === 2 ? [pageTwoTrade] : [pageOneTrade],
        page,
        pageSize,
        totalItems: 2,
        totalPages: 2,
    };
};
