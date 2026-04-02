import { Injectable } from '@nestjs/common';
import { ApiKey } from '@/module-api-keys/entities/api-key.entity';
import { TradingAccount } from '@/module-trading-account/entities/trading-account.entity';
import {
    TradingAccountApiKeySummary,
    TradingAccountSummary,
} from '@/module-trading-account/types/trading-account.types';

@Injectable()
export class TradingAccountViewService {
    buildTradingAccountSummary(
        tradingAccount: Pick<TradingAccount, 'id' | 'tradingAccountName' | 'exchange' | 'market'>,
        apiKey: TradingAccountApiKeySummary | null,
    ): TradingAccountSummary {
        return {
            id: tradingAccount.id,
            tradingAccountName: tradingAccount.tradingAccountName,
            exchange: tradingAccount.exchange,
            market: tradingAccount.market,
            apiKeyId: apiKey?.id ?? null,
            apiKey: apiKey
                ? {
                      apiKeyName: apiKey.apiKeyName,
                  }
                : null,
        };
    }

    toApiKeySummary(
        apiKey: Pick<ApiKey, 'id' | 'apiKeyName'> | null | undefined,
    ): TradingAccountApiKeySummary | null {
        if (!apiKey) {
            return null;
        }

        return {
            id: apiKey.id,
            apiKeyName: apiKey.apiKeyName,
        };
    }
}
