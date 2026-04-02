import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from '@/config/typeorm.config';
import { UserModule } from '@/module-user/user.module';
import { AuthModule } from '@/module-auth/auth.module';
import { AuthTokenModule } from '@/module-auth-token/auth-token.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';
import { CustomerFrontendModule } from '@/module-customer-frontend/customer-frontend.module';
import { AdminFrontendModule } from '@/module-admin-frontend/admin-frontend.module';
import { BullModule } from '@nestjs/bullmq';
import { getBullMqConfig } from '@config/bull-mq.config';
import { ProcessorModule } from '@/module-processor/processor.module';
import { TradesModule } from '@/module-trades/trades.module';

@Module({
    imports: [
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: getBullMqConfig,
        }),
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: getTypeOrmConfig,
        }),
        AdminFrontendModule,
        AuthModule,
        AuthTokenModule,
        ConfigModule,
        CustomerFrontendModule,
        UserModule,
        ProcessorModule,
        TradesModule,
    ],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: ResponseInterceptor,
        },
    ],
    controllers: [],
})
export class AppModule {}
