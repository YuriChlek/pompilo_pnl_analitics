import { Module } from '@nestjs/common';
import { ApiKeysService } from './services/api-keys.service';
import { ApiKeysController } from './api-keys.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from '@/module-api-keys/entities/api-key.entity';
import { AuthTokenModule } from '@/module-auth-token/auth-token.module';
import { ApiKeysRepositoryService } from '@/module-api-keys/services/api-keys.repository.service';
import { EncryptModule } from '@/module-encrypt/encrypt.module';
import { ApiKeysValidationService } from '@/module-api-keys/services/api-keys-validation.service';
import { BybitModule } from '@/module-bybit/bybit.module';

@Module({
    imports: [TypeOrmModule.forFeature([ApiKey]), AuthTokenModule, EncryptModule, BybitModule],
    controllers: [ApiKeysController],
    exports: [ApiKeysService],
    providers: [ApiKeysService, ApiKeysRepositoryService, ApiKeysValidationService],
})
export class ApiKeysModule {}
