export interface TradingAccountPayload {
    tradingAccountName: string;
    apiKeyId: string;
    exchange: string;
    market: string;
}

export interface TradingAccount {
    id: string;
    tradingAccountName: string;
    apiKey: {
        apiKeyName: string;
    };
    exchange: string;
    market: string;
}

/*
export interface TradingAccountStatistic {}
export interface TradingAccountClosedPnL {}
export interface TradingAccountOpenPnL {}
*/

export interface TradingAccountService {
    createTradingAccount: (tradingAccountPayload: TradingAccountPayload) => Promise<TradingAccount>;
    removeTradingAccount: (id: string) => Promise<void>;
    editTradingAccount: (
        tradingAccountPayload: TradingAccountPayload,
    ) => Promise<TradingAccountPayload>;
    getTradingAccountList: () => Promise<TradingAccount[]>;
    getTradingAccountStatistic: () => Promise<void>;
    getTradingAccountClosedPnL: () => Promise<void>;
    getTradingAccountOpenPnL: () => Promise<void>;
}
