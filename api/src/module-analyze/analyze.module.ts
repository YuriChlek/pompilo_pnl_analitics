import { Module } from '@nestjs/common';
import { AnalyzeService } from '@/module-analyze/services/analyze.service';
import { TradesModule } from '@/module-trades/trades.module';

@Module({
    imports: [TradesModule],
    exports: [AnalyzeService],
    providers: [AnalyzeService],
})
export class AnalyzeModule {}
