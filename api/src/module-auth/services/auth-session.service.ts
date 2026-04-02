import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import ms, { type StringValue } from 'ms';
import { AuthTokenService } from '@/module-auth-token/services/auth-token.service';
import { TOKEN_TYPE } from '@/module-auth-token/enums/auth-token.enums';
import { COOKIE_NAMES, USER_ROLES } from '@/module-auth/enums/auth-enums';
import { UserJWTPayload } from '@/module-user/interfaces/user.interfaces';

@Injectable()
export class AuthSessionService {
    private readonly cookieDomain: StringValue;
    private readonly accessTokenTtl: StringValue;
    private readonly refreshTokenTtl: StringValue;

    constructor(
        private readonly authTokenService: AuthTokenService,
        private readonly configService: ConfigService,
    ) {
        this.cookieDomain = this.configService.getOrThrow<StringValue>('COOKIE_DOMAIN');
        this.accessTokenTtl = this.configService.getOrThrow<StringValue>('JWT_ACCESS_TOKEN_TTL');
        this.refreshTokenTtl = this.configService.getOrThrow<StringValue>('JWT_REFRESH_TOKEN_TTL');
    }

    async issueTokens(
        response: Response,
        payload: UserJWTPayload,
        setRefreshToken = true,
    ): Promise<void> {
        try {
            const accessToken = this.authTokenService.createAccessToken(payload);
            this.setTokenCookie(response, accessToken, TOKEN_TYPE.ACCESS, payload.role);

            if (setRefreshToken) {
                const refreshToken = await this.authTokenService.createRefreshToken(payload);
                this.setTokenCookie(response, refreshToken, TOKEN_TYPE.REFRESH, payload.role);
            }
        } catch (error) {
            throw new InternalServerErrorException(
                error instanceof Error ? error.message : 'Failed to set authentication tokens',
            );
        }
    }

    clearTokens(response: Response, userRole: USER_ROLES): void {
        this.removeTokenCookie(response, userRole, this.getCookieName(userRole, TOKEN_TYPE.ACCESS));
        this.removeTokenCookie(response, userRole, this.getCookieName(userRole, TOKEN_TYPE.REFRESH));
    }

    getCookieName(userRole: USER_ROLES, type: TOKEN_TYPE): string {
        const isAdmin = userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.SUPER_ADMIN;

        if (isAdmin) {
            return type === TOKEN_TYPE.ACCESS
                ? COOKIE_NAMES.ADMIN_ACCESS_TOKEN
                : COOKIE_NAMES.ADMIN_REFRESH_TOKEN;
        }

        return type === TOKEN_TYPE.ACCESS
            ? COOKIE_NAMES.CUSTOMER_ACCESS_TOKEN
            : COOKIE_NAMES.CUSTOMER_REFRESH_TOKEN;
    }

    getUserMetaData(request: Request): { ipAddress: string; userAgent: string } {
        const ipAddress =
            request.headers['x-forwarded-for']?.toString().split(',')[0] ??
            (request.socket.remoteAddress as string);
        const userAgent = request.headers['user-agent'] as string;

        return { ipAddress, userAgent };
    }

    private setTokenCookie(
        response: Response,
        token: string,
        type: TOKEN_TYPE,
        userRole: USER_ROLES,
    ): void {
        const ttl = type === TOKEN_TYPE.ACCESS ? this.accessTokenTtl : this.refreshTokenTtl;
        const path =
            userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.SUPER_ADMIN ? '/admin' : '/';

        response.cookie(this.getCookieName(userRole, type), token, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            domain: this.cookieDomain,
            expires: new Date(Date.now() + ms(ttl)),
            path,
        });
    }

    private removeTokenCookie(response: Response, userRole: USER_ROLES, tokenName: string): void {
        const path =
            userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.SUPER_ADMIN ? '/admin' : '/';

        response.cookie(tokenName, '', {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            domain: this.cookieDomain,
            expires: new Date(0),
            path,
        });
    }
}
