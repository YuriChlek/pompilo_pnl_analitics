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
