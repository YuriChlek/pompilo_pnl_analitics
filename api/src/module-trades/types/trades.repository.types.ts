export type ClosedPnlStatisticsRaw = {
    totalTrades: string;
    winningTrades: string;
    losingTrades: string;
    totalClosedPnl: string | null;
    grossProfit: string | null;
    grossLoss: string | null;
    averageClosedPnl: string | null;
    bestTrade: string | null;
    worstTrade: string | null;
    latestTradeAt: string | null;
};

export type ClosedPnlStatistics = {
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
};

export type ClosedPnlTimelinePoint = {
    time: string;
    cumulativeClosedPnl: number;
};

export type ClosedPnlTradeSummary = {
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
};

export type ClosedPnlTradePage = {
    items: ClosedPnlTradeSummary[];
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
};
