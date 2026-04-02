import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ms, { type StringValue } from 'ms';
import { Argon2HashUtil } from '@/common/utils/hash.util';
import { normalizeStr } from '@/common/utils/string.utils';
import { RefreshTokenPayload } from '@/module-auth-token/interfaces/auth-token.interfaces';
import { AuthTokenRepositoryService } from '@/module-auth-token/services/auth-token.repository.service';

@Injectable()
export class RefreshTokenStorageService {
    private readonly refreshTokenTtl: StringValue;

    constructor(
        private readonly authTokenRepositoryService: AuthTokenRepositoryService,
        configService: ConfigService,
    ) {
        this.refreshTokenTtl = configService.getOrThrow<StringValue>('JWT_REFRESH_TOKEN_TTL');
    }

    async saveRefreshToken(
        refreshTokenPayload: RefreshTokenPayload,
        refreshToken: string,
    ): Promise<void> {
        const existingRefreshToken = await this.authTokenRepositoryService.findRefreshToken(
            refreshTokenPayload.userId,
            refreshTokenPayload.ipAddress,
            refreshTokenPayload.userAgent,
        );
        const refreshTokenHash = await Argon2HashUtil.hash(refreshToken);
        const expiresAt = new Date(Date.now() + ms(this.refreshTokenTtl));

        if (existingRefreshToken) {
            await this.authTokenRepositoryService.updateRefreshToken(
                refreshTokenPayload,
                refreshTokenHash,
                expiresAt,
            );

            return;
        }

        await this.authTokenRepositoryService.createRefreshToken(
            {
                ...refreshTokenPayload,
                userAgent: normalizeStr(refreshTokenPayload.userAgent),
            },
            refreshTokenHash,
            expiresAt,
        );
    }
}
