import { Module } from '@nestjs/common';
import { ExchangePnlProcessor } from '@/module-processor/processors/exchange-pnl.processor';
import { BybitModule } from '@/module-bybit/bybit.module';

@Module({
    imports: [BybitModule],
    providers: [ExchangePnlProcessor],
})
export class ProcessorModule {}
