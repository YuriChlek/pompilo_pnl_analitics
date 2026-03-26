import { Module } from '@nestjs/common';
import { ExchangePnlProcessor } from '@/module-processor/processors/exchange-pnl.processor';
import { BybitModule } from '@/module-bybit/bybit.module';
import { TradesModule } from '@/module-trades/trades.module';

@Module({
    imports: [BybitModule, TradesModule],
    providers: [ExchangePnlProcessor],
})
export class ProcessorModule {}
