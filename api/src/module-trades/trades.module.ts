import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FuturesClosedPnl } from '@/module-trades/entities/futures-closed-pnl.entity';
import { TradesRepositoryService } from '@/module-trades/services/trades-repository.service';

@Module({
    imports: [TypeOrmModule.forFeature([FuturesClosedPnl])],
    exports: [TradesRepositoryService],
    providers: [TradesRepositoryService],
})
export class TradesModule {}
