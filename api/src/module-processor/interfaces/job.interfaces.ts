import { EXCHANGES, MARKET_TYPES } from '@/module-api-keys/enums/api-keys-enums';

export interface ExchangeSyncPnlJob {
    tradingAccountId: string;
    apiKey: string;
    secretKey: string;
    market: MARKET_TYPES;
}

export interface BybitSyncPnlJobResponse extends ExchangeSyncPnlJob {
    exchange: EXCHANGES.BYBIT_DEMO | EXCHANGES.BYBIT;
}
