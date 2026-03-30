import { Module } from '@nestjs/common';
import { AnalyseService } from '@/module-analyze/services/analyse.service';
import { TradesModule } from '@/module-trades/trades.module';

@Module({
    imports: [TradesModule],
    exports: [AnalyseService],
    providers: [AnalyseService],
})
export class AnalyseModule {}
