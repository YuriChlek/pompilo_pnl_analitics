import {
    BadRequestException,
    HttpException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { TokenService } from '@/module-auth-token/services/token.service';
import {
    type AccessTokenPayload,
    RefreshTokenPayload,
} from '@/module-auth-token/interfaces/auth-token.interfaces';
import { RefreshTokenVerificationResult } from '@/module-auth-token/types/auth-token.types';
import { UserJWTPayload } from '@/module-user/interfaces/user.interfaces';
import { AuthTokenRepositoryService } from '@/module-auth-token/services/auth-token.repository.service';
import { AuthTokenPayloadService } from '@/module-auth-token/services/auth-token-payload.service';
import { RefreshTokenVerificationService } from '@/module-auth-token/services/refresh-token-verification.service';
import { RefreshTokenStorageService } from '@/module-auth-token/services/refresh-token-storage.service';

@Injectable()
export class AuthTokenService {
    public constructor(
        private readonly tokenService: TokenService,
        private readonly authTokenRepository: AuthTokenRepositoryService,
        private readonly authTokenPayloadService: AuthTokenPayloadService,
        private readonly refreshTokenVerificationService: RefreshTokenVerificationService,
        private readonly refreshTokenStorageService: RefreshTokenStorageService,
    ) {}

    createAccessToken(user: UserJWTPayload): string {
        try {
            const accessTokenPayload: AccessTokenPayload =
                this.authTokenPayloadService.createAccessTokenPayload(user);

            return this.tokenService.createAccessToken(accessTokenPayload);
        } catch (error) {
            this.handleUnexpectedError(error, 'Failed to create access token');
        }
    }

    getTokenData(token: string): AccessTokenPayload | RefreshTokenPayload {
        return this.tokenService.verifyToken(token);
    }

    async createRefreshToken(user: UserJWTPayload): Promise<string> {
        try {
            const refreshTokenPayload: RefreshTokenPayload =
                this.authTokenPayloadService.createRefreshTokenPayload(user);

            const refreshToken: string = this.tokenService.createRefreshToken(refreshTokenPayload);
            await this.refreshTokenStorageService.saveRefreshToken(
                refreshTokenPayload,
                refreshToken,
            );

            return refreshToken;
        } catch (error) {
            this.handleUnexpectedError(error, 'Failed to create refresh token');
        }
    }

    async verifyRefreshToken(
        token: string,
        customerUserAgent: string,
        customerIpAddress: string,
    ): Promise<RefreshTokenVerificationResult> {
        return await this.refreshTokenVerificationService.verify(
            token,
            customerUserAgent,
            customerIpAddress,
        );
    }

    async removeRefreshToken(userId: string, customerUserAgent: string, customerIpAddress: string) {
        await this.authTokenRepository.removeRefreshToken(
            userId,
            customerUserAgent,
            customerIpAddress,
        );
    }

    private handleUnexpectedError(error: unknown, message: string): never {
        if (error instanceof HttpException) {
            throw error;
        }

        throw new InternalServerErrorException(message);
    }
}
