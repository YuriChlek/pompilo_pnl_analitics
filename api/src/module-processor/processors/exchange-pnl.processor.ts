import { Processor, WorkerHost } from '@nestjs/bullmq';
import { BybitService } from '@/module-bybit/services/bybit.service';
import { Job } from 'bullmq';
import { BybitSyncPnlJobResponse } from '@/module-processor/interfaces/job.interfaces';
import { InternalServerErrorException } from '@nestjs/common';
import { FuturesClosedPnl } from '@/module-trades/entities/futures-closed-pnl.entity';
import { TradesRepositoryService } from '@/module-trades/services/trades-repository.service';
import { EXCHANGE_PNL_QUEUE } from '@/module-processor/constants/processor.constants';

@Processor(EXCHANGE_PNL_QUEUE)
export class ExchangePnlProcessor extends WorkerHost {
    constructor(
        private readonly bybitService: BybitService,
        private readonly tradesRepositoryService: TradesRepositoryService,
    ) {
        super();
    }

    async process(job: Job<BybitSyncPnlJobResponse>): Promise<void> {
        try {
            await this.handleBybitSync(job);
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }

            throw new InternalServerErrorException('Exchange PnL processing failed');
        }
    }

    private async handleBybitSync(job: Job<BybitSyncPnlJobResponse>): Promise<void> {
        const lastTradeTime = await this.tradesRepositoryService.findLatestUpdatedTime(
            job.data.tradingAccountId,
        );
        const result: FuturesClosedPnl[] = await this.bybitService.getTradingPnl(
            job.data.exchange,
            job.data.apiKey,
            job.data.secretKey,
            job.data.market,
            lastTradeTime,
        );

        await this.bybitService.savePnl(result, job.data.tradingAccountId);
    }
}
