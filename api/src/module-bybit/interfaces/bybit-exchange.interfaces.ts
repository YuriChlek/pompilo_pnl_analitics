import { MARKET_TYPES } from '@/module-api-keys/enums/api-keys.enums';
import { FuturesClosedPnl } from '@/module-trades/entities/futures-closed-pnl.entity';

export interface BybitQueryApiResponse<T> {
    retCode: number;
    retMsg: string;
    result: T;
    retExtInfo: Record<string, unknown>;
    time: number;
}

export interface BybitApiKeyInfo {
    id: string;
    note: string;
    apiKey: string;
    readOnly: number;
    secret: string;
    permissions: BybitPermissions;
    ips: string[];
    type: number;
    deadlineDay: number;
    expiredAt: string;
    createdAt: string;
    unified: number;
    uta: number;
    userID: string;
    inviterID: number;
    vipLevel: string;
    mktMakerLevel: string;
    affiliateID: number;
    rsaPublicKey: string;
    isMaster: boolean;
    parentUid: string;
    kycLevel: string;
    kycRegion: string;
}

export interface BybitPermissions {
    ContractTrade: string[];
    Spot: string[];
    Wallet: string[];
    Options: string[];
    Derivatives: string[];
    CopyTrading: string[];
    BlockTrade: string[];
    Exchange: string[];
    NFT: string[];
    Affiliate: string[];
    Earn: string[];
    FiatP2P: string[];
    FiatBybitPay: string[];
    FiatConvertBroker: string[];
}

export interface BybitClosedPnlResult {
    nextPageCursor: string | null;
    category: MARKET_TYPES;
    list: FuturesClosedPnl[];
}

export interface BybitClosedPnlItem {
    symbol: string;
    orderType: 'Market' | 'Limit';
    leverage: string;
    updatedTime: string;
    side: 'Buy' | 'Sell';
    orderId: string;
    closedPnl: string;
    openFee: string;
    closeFee: string;
    avgEntryPrice: string;
    avgExitPrice: string;
    qty: string;
    closedSize: string;
    cumEntryValue: string;
    cumExitValue: string;
    createdTime: string;
    orderPrice: string;
    execType: string;
    fillCount: string;
}
