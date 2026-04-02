import { BybitApiService } from '@/module-bybit/services/bybit-api.service';
import { Module } from '@nestjs/common';
import { BybitService } from '@/module-bybit/services/bybit.service';
import { TradesModule } from '@/module-trades/trades.module';

@Module({
    imports: [TradesModule],
    exports: [BybitService],
    providers: [BybitApiService, BybitService],
})
export class BybitModule {}
