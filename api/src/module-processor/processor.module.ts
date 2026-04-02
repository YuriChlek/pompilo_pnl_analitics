import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ExchangePnlProcessor } from '@/module-processor/processors/exchange-pnl.processor';
import { BybitModule } from '@/module-bybit/bybit.module';
import { TradesModule } from '@/module-trades/trades.module';
import { EXCHANGE_PNL_QUEUE } from '@/module-processor/constants/processor.constants';

@Module({
    imports: [
        BullModule.registerQueue({
            name: EXCHANGE_PNL_QUEUE,
        }),
        BybitModule,
        TradesModule,
    ],
    providers: [ExchangePnlProcessor],
})
export class ProcessorModule {}
