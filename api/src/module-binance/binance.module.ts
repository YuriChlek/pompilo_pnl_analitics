import { Module } from '@nestjs/common';
import { BinanceService } from '@/module-binance/services/binance.service';

@Module({
    providers: [BinanceService],
})
export class BinanceModule {}
