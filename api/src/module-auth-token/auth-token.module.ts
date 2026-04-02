import { Module } from '@nestjs/common';
import { AuthTokenService } from '@/module-auth-token/services/auth-token.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Token } from '@/module-auth-token/entities/auth-token.entity';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from '@/module-auth-token/services/token.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getJWTConfig } from '@config/jwt.config';
import { AuthTokenRepositoryService } from '@/module-auth-token/services/auth-token.repository.service';
import { AuthTokenPayloadService } from '@/module-auth-token/services/auth-token-payload.service';
import { RefreshTokenVerificationService } from '@/module-auth-token/services/refresh-token-verification.service';
import { RefreshTokenStorageService } from '@/module-auth-token/services/refresh-token-storage.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Token]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: getJWTConfig,
        }),
    ],
    providers: [
        AuthTokenService,
        TokenService,
        AuthTokenRepositoryService,
        AuthTokenPayloadService,
        RefreshTokenVerificationService,
        RefreshTokenStorageService,
    ],
    exports: [AuthTokenService, TokenService],
})
export class AuthTokenModule {}
