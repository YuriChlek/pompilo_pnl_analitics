import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TradingAccount } from '@/module-trading-account/entities/trading-account.entity';
import { TradingAccountController } from '@/module-trading-account/trading-account.controller';
import { TradingAccountService } from '@/module-trading-account/services/trading-account.service';
import { BullModule } from '@nestjs/bullmq';
import { TradingAccountRepositoryService } from '@/module-trading-account/services/trading-account-repository.service';
import { ApiKeysModule } from '@/module-api-keys/api-keys.module';
import { AuthTokenModule } from '@/module-auth-token/auth-token.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([TradingAccount]),
        BullModule.registerQueue({
            name: 'excange-pnl-sync',
        }),
        ApiKeysModule,
        AuthTokenModule,
    ],
    controllers: [TradingAccountController],
    providers: [TradingAccountService, TradingAccountRepositoryService],
})
export class TradingAccountModule {}
