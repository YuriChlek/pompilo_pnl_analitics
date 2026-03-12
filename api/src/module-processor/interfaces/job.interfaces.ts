import { Exchanges, MarketTypes } from '@/module-api-keys/enums';

export interface ExchangeSyncPnlJob {
    tradingAccountId: string;
    apiKey: string;
    secretKey: string;
    market: MarketTypes;
}

export interface BybitSyncPnlJobResponse extends ExchangeSyncPnlJob {
    exchange: Exchanges.BYBIT_DEMO | Exchanges.BYBIT;
}
