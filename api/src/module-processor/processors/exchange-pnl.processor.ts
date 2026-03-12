import { Processor, WorkerHost } from '@nestjs/bullmq';
import { BybitService } from '@/module-bybit/services/bybit.service';
import { Job } from 'bullmq';
import { BybitSyncPnlJobResponse } from '@/module-processor/interfaces/job.interfaces';
import { BadRequestException } from '@nestjs/common';
import { FuturesClosedPnl } from '@/module-trades/entities/futures-closed-pnl.entity';

@Processor('excange-pnl-sync')
export class ExchangePnlProcessor extends WorkerHost {
    constructor(private readonly bybitService: BybitService) {
        super();
    }

    async process(job: Job<BybitSyncPnlJobResponse>): Promise<void> {
        try {
            await this.handleBybitSync(job);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            }

            throw new BadRequestException(error);
        }
    }

    private async handleBybitSync(job: Job<BybitSyncPnlJobResponse>): Promise<void> {
        const result: FuturesClosedPnl[] = await this.bybitService.getTradingPnl(
            job.data.exchange,
            job.data.apiKey,
            job.data.secretKey,
            job.data.market,
            '0',
        );

        await this.bybitService.savePnl(result, job.data.tradingAccountId);
    }
}
