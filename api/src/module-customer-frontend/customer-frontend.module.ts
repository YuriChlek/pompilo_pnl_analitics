import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { CustomerAuthModule } from '@/module-customer-auth/customer-auth.module';
import { ApiKeysModule } from '@/module-api-keys/api-keys.module';
import { BybitModule } from '@/module-bybit/bybit.module';
import { EncryptModule } from '@/module-encrypt/encrypt.module';
import { BinanceModule } from '@/module-binance/binance.module';
import { TradingAccountModule } from '@/module-trading-account/trading-account.module';
import { AnalyzeModule } from '@/module-analyze/analyze.module';

@Module({
    imports: [
        CustomerAuthModule,
        ApiKeysModule,
        BybitModule,
        BinanceModule,
        EncryptModule,
        TradingAccountModule,
        AnalyzeModule,
        RouterModule.register([
            {
                path: 'customer',
                children: [
                    {
                        path: 'api-key',
                        module: ApiKeysModule,
                    },
                    {
                        path: 'trading-account',
                        module: TradingAccountModule,
                    },
                    {
                        path: '',
                        module: CustomerAuthModule,
                    },
                ],
            },
        ]),
    ],
})
export class CustomerFrontendModule {}
