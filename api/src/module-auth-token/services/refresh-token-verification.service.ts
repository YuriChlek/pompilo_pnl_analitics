import { BadRequestException, Injectable } from '@nestjs/common';
import {
    type AccessTokenPayload,
    RefreshTokenPayload,
    TokenFromDbPayload,
} from '@/module-auth-token/interfaces/auth-token.interfaces';
import { RefreshTokenVerificationResult } from '@/module-auth-token/types/auth-token.types';
import { AuthTokenRepositoryService } from '@/module-auth-token/services/auth-token.repository.service';
import { TokenService } from '@/module-auth-token/services/token.service';
import { Argon2HashUtil } from '@/common/utils/hash.util';
import { normalizeStr } from '@/common/utils/string.utils';

@Injectable()
export class RefreshTokenVerificationService {
    constructor(
        private readonly tokenService: TokenService,
        private readonly authTokenRepository: AuthTokenRepositoryService,
    ) {}

    async verify(
        token: string,
        customerUserAgent: string,
        customerIpAddress: string,
    ): Promise<RefreshTokenVerificationResult> {
        const payload: AccessTokenPayload | RefreshTokenPayload = this.tokenService.verifyToken(token);

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
}
