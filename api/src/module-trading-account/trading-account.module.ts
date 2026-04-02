import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TradingAccount } from '@/module-trading-account/entities/trading-account.entity';
import { TradingAccountBinding } from '@/module-trading-account/entities/trading-account-binding.entity';
import { TradingAccountController } from '@/module-trading-account/trading-account.controller';
import { TradingAccountService } from '@/module-trading-account/services/trading-account.service';
import { BullModule } from '@nestjs/bullmq';
import { TradingAccountRepositoryService } from '@/module-trading-account/services/trading-account-repository.service';
import { TradingAccountBindingRepositoryService } from '@/module-trading-account/services/trading-account-binding.repository.service';
import { TradingAccountQueryService } from '@/module-trading-account/services/trading-account-query.service';
import { ApiKeysModule } from '@/module-api-keys/api-keys.module';
import { AuthTokenModule } from '@/module-auth-token/auth-token.module';
import { TradesModule } from '@/module-trades/trades.module';
import { AnalyzeModule } from '@/module-analyze/analyze.module';
import { EXCHANGE_PNL_QUEUE } from '@/module-processor/constants/processor.constants';
import { TradingAccountSyncService } from '@/module-trading-account/services/trading-account-sync.service';
import { TradingAccountAccessService } from '@/module-trading-account/services/trading-account-access.service';
import { TradingAccountViewService } from '@/module-trading-account/services/trading-account-view.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([TradingAccount, TradingAccountBinding]),
        BullModule.registerQueue({
            name: EXCHANGE_PNL_QUEUE,
        }),
        ApiKeysModule,
        AuthTokenModule,
        TradesModule,
        AnalyzeModule,
    ],
    controllers: [TradingAccountController],
    providers: [
        TradingAccountService,
        TradingAccountQueryService,
        TradingAccountRepositoryService,
        TradingAccountBindingRepositoryService,
        TradingAccountSyncService,
        TradingAccountAccessService,
        TradingAccountViewService,
    ],
})
export class TradingAccountModule {}
