import { Module } from '@nestjs/common';
import { AuthTokenService } from '@/module-auth-token/services/auth-token.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Token } from '@/module-auth-token/entities/auth-token.entity';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from '@/module-auth-token/services/token.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getJWTConfig } from '@config/jwt.config';
import { AuthTokenRepositoryService } from '@/module-auth-token/services/auth-token.repository.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Token]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: getJWTConfig,
        }),
    ],
    providers: [AuthTokenService, TokenService, AuthTokenRepositoryService],
    exports: [AuthTokenService, TokenService],
})
export class AuthTokenModule {}
