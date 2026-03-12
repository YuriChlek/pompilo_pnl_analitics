import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { TokenService } from '@/module-auth-token/services/token.service';
import {
    type AccessTokenPayload,
    RefreshTokenPayload,
    RefreshTokenVerificationResult,
    TokenFromDbPayload,
    TokenType,
} from '@/module-auth-token/interfaces/auth-token.interfaces';
import { UserJWTPayload } from '@/module-user/interfaces/user.interface';
import { Argon2HashUtil } from '@/common/utils/hash.util';
import { randomBytes } from 'crypto';
import { normalizeStr } from '@/common/utils/string.utils';
import { AuthTokenRepositoryService } from '@/module-auth-token/services/auth-token.repository.service';

@Injectable()
export class AuthTokenService {
    public constructor(
        private readonly tokenService: TokenService,
        private readonly authTokenRepository: AuthTokenRepositoryService,
    ) {}

    createAccessToken(user: UserJWTPayload): string {
        try {
            const accessTokenPayload: AccessTokenPayload = {
                sub: user.id,
                userId: user.id,
                email: user.email,
                username: user.name,
                role: user.role,
                ipAddress: user.ipAddress,
                userAgent: normalizeStr(user.userAgent),
                type: TokenType.ACCESS,
            };

            return this.tokenService.createAccessToken(accessTokenPayload);
        } catch (error) {
            if (error instanceof Error) {
                throw new BadRequestException(error.message);
            }

            throw new InternalServerErrorException('An unexpected error occurred');
        }
    }

    getTokenData(token: string): AccessTokenPayload | RefreshTokenPayload {
        return this.tokenService.verifyToken(token);
    }

    async createRefreshToken(user: UserJWTPayload): Promise<string> {
        try {
            const refreshTokenPayload: RefreshTokenPayload = {
                sub: user.id,
                userId: user.id,
                userAgent: normalizeStr(user.userAgent),
                ipAddress: user.ipAddress,
                type: TokenType.REFRESH,
                jti: randomBytes(64).toString('hex'),
            };

            const refreshToken: string = this.tokenService.createRefreshToken(refreshTokenPayload);
            await this.authTokenRepository.saveRefreshTokenData(refreshTokenPayload, refreshToken);

            return refreshToken;
        } catch (error) {
            if (error instanceof Error) {
                throw new BadRequestException(error.message);
            }
            throw new InternalServerErrorException('An unexpected error occurred');
        }
    }

    async verifyRefreshToken(
        token: string,
        customerUserAgent: string,
        customerIpAddress: string,
    ): Promise<RefreshTokenVerificationResult> {
        const payload: AccessTokenPayload | RefreshTokenPayload =
            this.tokenService.verifyToken(token);

        if (!payload) {
            throw new BadRequestException('Refresh token not found.');
        }

        const refreshTokenData: TokenFromDbPayload | null =
            await this.authTokenRepository.findRefreshToken(
                payload.userId,
                payload.ipAddress,
                normalizeStr(payload.userAgent),
                true,
            );

        if (!refreshTokenData || !refreshTokenData.user) {
            return { verified: false };
        }

        const { refreshToken, userAgent, ipAddress, user } = refreshTokenData;

        if (
            normalizeStr(userAgent) !== normalizeStr(customerUserAgent) ||
            ipAddress !== customerIpAddress
        ) {
            return { verified: false };
        }

        const verified = await Argon2HashUtil.compare(token, refreshToken);

        if (!verified) {
            return { verified };
        }
        return {
            verified,
            user,
        };
    }

    async removeRefreshToken(userId: string, customerUserAgent: string, customerIpAddress: string) {
        await this.authTokenRepository.removeRefreshToken(
            userId,
            customerUserAgent,
            customerIpAddress,
        );
    }
}
