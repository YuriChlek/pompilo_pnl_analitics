import { Injectable } from '@nestjs/common';
import { FindOptionsSelect } from 'typeorm';
import { Token } from '@/module-auth-token/entities/auth-token.entity';
import { Repository, MoreThan } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import ms, { type StringValue } from 'ms';
import { Argon2HashUtil } from '@/common/utils/hash.util';
import { normalizeStr } from '@/common/utils/string.utils';
import { InternalServerErrorException } from '@nestjs/common';
import {
    RefreshTokenPayload,
    TokenFromDbPayload,
} from '@/module-auth-token/interfaces/auth-token.interfaces';

@Injectable()
export class AuthTokenRepositoryService {
    private readonly JWT_REFRESH_TOKEN_TTL: StringValue;

    public constructor(
        @InjectRepository(Token)
        private readonly tokenRepository: Repository<Token>,
        private readonly configService: ConfigService,
    ) {
        this.JWT_REFRESH_TOKEN_TTL =
            this.configService.getOrThrow<StringValue>('JWT_REFRESH_TOKEN_TTL');
    }

    async saveRefreshTokenData(
        refreshTokenPayload: RefreshTokenPayload,
        userRefreshToken: string,
    ): Promise<void> {
        try {
            const refreshTokenData = await this.findRefreshToken(
                refreshTokenPayload.userId,
                refreshTokenPayload.ipAddress,
                refreshTokenPayload.userAgent,
            );
            const refreshTokenHash = await Argon2HashUtil.hash(userRefreshToken);
            const expiresAt = new Date(Date.now() + ms(this.JWT_REFRESH_TOKEN_TTL));

            const isSameClient =
                refreshTokenData &&
                refreshTokenData.ipAddress === refreshTokenPayload.ipAddress &&
                normalizeStr(refreshTokenData.userAgent) ===
                    normalizeStr(refreshTokenPayload.userAgent);

            if (isSameClient) {
                await this.updateRefreshToken(refreshTokenPayload, refreshTokenHash);
                return;
            }

            if (!refreshTokenData) {
                const { userId, ipAddress, userAgent } = refreshTokenPayload;

                await this.tokenRepository.save({
                    userId,
                    refreshToken: refreshTokenHash,
                    ipAddress,
                    userAgent: normalizeStr(userAgent),
                    expiresAt,
                });
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new InternalServerErrorException(error.message);
            }

            throw new InternalServerErrorException('An unexpected error occurred');
        }
    }

    async updateRefreshToken(
        refreshTokenPayload: RefreshTokenPayload,
        refreshTokenHash: string,
    ): Promise<void> {
        await this.tokenRepository.update(
            {
                user: { id: refreshTokenPayload.userId },
                isActive: true,
                ipAddress: refreshTokenPayload.ipAddress,
                userAgent: refreshTokenPayload.userAgent,
            },
            {
                refreshToken: refreshTokenHash,
                userAgent: refreshTokenPayload.userAgent,
                ipAddress: refreshTokenPayload.ipAddress,
                expiresAt: new Date(Date.now() + ms(this.JWT_REFRESH_TOKEN_TTL)),
            },
        );
    }

    async findRefreshToken(
        userId: string,
        _ipAddress: string,
        _userAgent: string,
        getUserData = false,
    ): Promise<TokenFromDbPayload | null> {
        const select: FindOptionsSelect<Token> = this.buildFindTokenSelect(getUserData);
        const refreshTokenData: Token | null = await this.tokenRepository.findOne({
            where: {
                user: { id: userId },
                isActive: true,
                expiresAt: MoreThan(new Date()),
                ipAddress: _ipAddress,
                userAgent: normalizeStr(_userAgent),
            },
            relations: getUserData ? ['user'] : [],
            select,
        });

        if (!refreshTokenData) {
            return null;
        }

        const { refreshToken, ipAddress, userAgent, user } = refreshTokenData;
        const payload: TokenFromDbPayload = {
            refreshToken,
            ipAddress,
            userAgent,
        };

        if (user && getUserData) {
            payload.user = user;
        }

        return payload;
    }

    private buildFindTokenSelect(getUserData: boolean): FindOptionsSelect<Token> {
        const selectQuery: FindOptionsSelect<Token> = {
            id: true,
            refreshToken: true,
            userAgent: true,
            ipAddress: true,
        };

        if (getUserData) {
            selectQuery.user = {
                id: true,
                email: true,
                name: true,
                role: true,
            };
        }

        return selectQuery;
    }

    async removeRefreshToken(
        userId: string,
        customerUserAgent: string,
        customerIpAddress: string,
    ): Promise<void> {
        await this.tokenRepository.delete({
            user: { id: userId },
            isActive: true,
            ipAddress: customerIpAddress,
            userAgent: normalizeStr(customerUserAgent),
        });
    }
}
