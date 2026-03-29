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

/*
export interface TradingAccountStatistic {}
export interface TradingAccountClosedPnL {}
export interface TradingAccountOpenPnL {}
*/

export interface TradingAccountService {
    createTradingAccount: (tradingAccountPayload: TradingAccountPayload) => Promise<TradingAccount>;
    removeTradingAccount: (id: string) => Promise<boolean | null>;
    editTradingAccount: (
        id: string,
        tradingAccountPayload: TradingAccountPayload,
    ) => Promise<TradingAccount | null>;
    getTradingAccountList: () => Promise<TradingAccount[]>;
    getTradingAccountStatistic: () => Promise<void>;
    getTradingAccountClosedPnL: () => Promise<void>;
    getTradingAccountOpenPnL: () => Promise<void>;
}
