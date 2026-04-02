import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ApiKey } from '@/module-api-keys/entities/api-key.entity';
import { TradingAccount } from '@/module-trading-account/entities/trading-account.entity';
import { EXCHANGE_PNL_QUEUE } from '@/module-processor/constants/processor.constants';

@Injectable()
export class TradingAccountSyncService {
    constructor(
        @InjectQueue(EXCHANGE_PNL_QUEUE)
        private readonly exchangePnlQueue: Queue,
    ) {}

    async enqueueExchangePnlSync(
        tradingAccount: Pick<TradingAccount, 'id' | 'market'>,
        apiKey: Pick<ApiKey, 'apiKey' | 'secretKey' | 'exchange'>,
    ): Promise<void> {
        await this.exchangePnlQueue.add(EXCHANGE_PNL_QUEUE, {
            tradingAccountId: tradingAccount.id,
            market: tradingAccount.market,
            apiKey: apiKey.apiKey,
            secretKey: apiKey.secretKey,
            exchange: apiKey.exchange,
        });
    }
}
