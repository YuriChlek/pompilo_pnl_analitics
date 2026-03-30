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
