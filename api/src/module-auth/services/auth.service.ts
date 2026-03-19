import {
    HttpException,
    Injectable,
    InternalServerErrorException,
    UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '@/module-user/services/user.service';
import { AuthTokenService } from '@/module-auth-token/services/auth-token.service';
import { UserJWTPayload, UserPayload } from '@/module-user/interfaces/user.interface';
import { RegisterUserDto } from '@/module-auth/dto/register-user.dto';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import ms, { type StringValue } from 'ms';
import { LoginUserDto } from '@/module-auth/dto/login-user.dto';
import { User } from '@/module-user/entities/user.entity';
import { Argon2HashUtil } from '@/common/utils/hash.util';
import { USER_ROLES, COOKIE_NAMES } from '@/module-auth/enums/auth-enums';

import {
    type AccessTokenPayload,
    RefreshTokenVerificationResult,
} from '@/module-auth-token/interfaces/auth-token.interfaces';
import { TOKEN_TYPE } from '@/module-auth-token/enums/auth-token-enums';

@Injectable()
export class AuthService {
    private readonly COOKIE_DOMAIN: StringValue;
    private readonly JWT_ACCESS_TOKEN_TTL: StringValue;
    private readonly JWT_REFRESH_TOKEN_TTL: StringValue;

    public constructor(
        private readonly userService: UserService,
        private readonly tokenService: AuthTokenService,
        private readonly configService: ConfigService,
    ) {
        this.COOKIE_DOMAIN = this.configService.getOrThrow<StringValue>('COOKIE_DOMAIN');
        this.JWT_ACCESS_TOKEN_TTL =
            this.configService.getOrThrow<StringValue>('JWT_ACCESS_TOKEN_TTL');
        this.JWT_REFRESH_TOKEN_TTL =
            this.configService.getOrThrow<StringValue>('JWT_REFRESH_TOKEN_TTL');
    }

    async register(
        response: Response,
        request: Request,
        registerUserDto: RegisterUserDto,
    ): Promise<UserPayload> {
        try {
            const { id, name, email, role } = await this.userService.create(registerUserDto);
            const { ipAddress, userAgent } = this.getUserMetaData(request);
            const userJWTPayload = {
                id,
                name,
                email,
                role,
                ipAddress,
                userAgent,
            };

            await this.setTokens(response, userJWTPayload);

            return {
                id,
                name,
                email,
                role,
            };
        } catch (error) {
            this.handleUnexpectedError(error, 'Failed to register user');
        }
    }

    async login(
        response: Response,
        request: Request,
        loginUserDto: LoginUserDto,
    ): Promise<UserPayload> {
        try {
            const { login, password, role } = loginUserDto;
            const { ipAddress, userAgent } = this.getUserMetaData(request);
            const user: User | null = await this.userService.findByLogin(login);

            if (!user || !user.isActive || !this.isRoleAllowed(user.role, role)) {
                throw new UnauthorizedException('Login or password is not valid.');
            }

            const isPasswordValid = await Argon2HashUtil.compare(password, user.password);
            if (!isPasswordValid) {
                throw new UnauthorizedException('Login or password is not valid.');
            }

            const userPayload = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            };

            const userJWTPayload: UserJWTPayload = {
                ...userPayload,
                ipAddress,
                userAgent,
            };

            await this.setTokens(response, userJWTPayload);

            return userPayload;
        } catch (error) {
            this.handleUnexpectedError(error, 'Failed to log in user');
        }
    }

    async logout(request: Request, response: Response, userRole: USER_ROLES) {
        const cookiesKeys: string[] = Object.keys(request.cookies);
        const accessTokenCookieName: string = this.getCookieName(userRole, TOKEN_TYPE.ACCESS);
        const refreshTokenCookieName: string = this.getCookieName(userRole, TOKEN_TYPE.REFRESH);

        if (
            !cookiesKeys.includes(accessTokenCookieName) ||
            !cookiesKeys.includes(refreshTokenCookieName)
        ) {
            throw new UnauthorizedException('Unauthorized user token.');
        }

        const refreshToken = request.cookies[refreshTokenCookieName] as string;
        const { ipAddress, userAgent } = this.getUserMetaData(request);
        const { userId } = this.tokenService.getTokenData(refreshToken);
        const refreshTokenValid: RefreshTokenVerificationResult =
            await this.tokenService.verifyRefreshToken(refreshToken, userAgent, ipAddress);

        if (!refreshTokenValid.verified) {
            throw new UnauthorizedException('Unauthorized user token.');
        }

        this.removeTokenCookie(response, userRole, accessTokenCookieName);
        this.removeTokenCookie(response, userRole, refreshTokenCookieName);
        await this.tokenService.removeRefreshToken(userId, userAgent, ipAddress);
    }

    getMe(request: Request, userRole: USER_ROLES): UserPayload | null {
        const cookieName: string = this.getCookieName(userRole, TOKEN_TYPE.ACCESS);
        const userToken: string = request.cookies[cookieName] as string;

        if (userToken) {
            const { userId, email, username, role } = this.tokenService.getTokenData(
                userToken,
            ) as AccessTokenPayload;

            return {
                id: userId,
                email,
                name: username,
                role: role as USER_ROLES,
            };
        }

        return null;
    }

    async refreshAccessToken(
        response: Response,
        request: Request,
        tokenType: string,
    ): Promise<boolean> {
        const cookiesKeys: string[] = Object.keys(request.cookies);
        const { ipAddress, userAgent } = this.getUserMetaData(request);

        if (!cookiesKeys.includes(tokenType)) {
            return false;
        }

        const refreshToken = request.cookies[tokenType] as string;
        const verificationResult: RefreshTokenVerificationResult =
            await this.tokenService.verifyRefreshToken(refreshToken, userAgent, ipAddress);

        if (!verificationResult.verified) {
            return false;
        }

        const { id, name, email, role } = verificationResult.user;

        if (id && name && email && role) {
            const userJWTPayload = {
                id,
                name,
                email,
                role,
                ipAddress,
                userAgent,
            };
            await this.setTokens(response, userJWTPayload, false);

            return true;
        }

        return false;
    }

    private setTokenCookie(
        response: Response,
        token: string,
        type: TOKEN_TYPE,
        userRole: USER_ROLES,
    ): void {
        try {
            const ttl =
                type === TOKEN_TYPE.ACCESS ? this.JWT_ACCESS_TOKEN_TTL : this.JWT_REFRESH_TOKEN_TTL;
            const ttlMs = ms(ttl);
            const expires = new Date(Date.now() + ttlMs);
            const path: string =
                userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.SUPER_ADMIN
                    ? '/admin'
                    : '/';
            const cookieName: string = this.getCookieName(userRole, type);

            response.cookie(cookieName, token, {
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                domain: this.COOKIE_DOMAIN,
                expires,
                path,
            });
        } catch (error) {
            this.handleUnexpectedError(error, 'Failed to set authentication cookie');
        }
    }

    private removeTokenCookie(response: Response, userRole: USER_ROLES, tokenName: string): void {
        const path =
            userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.SUPER_ADMIN ? '/admin' : '/';

        response.cookie(tokenName, '', {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            domain: this.COOKIE_DOMAIN,
            expires: new Date(0),
            path,
        });
    }

    private getCookieName(userRole: USER_ROLES, type: TOKEN_TYPE): string {
        const isAdmin: boolean =
            userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.SUPER_ADMIN;

        if (isAdmin) {
            return type === TOKEN_TYPE.ACCESS
                ? COOKIE_NAMES.ADMIN_ACCESS_TOKEN
                : COOKIE_NAMES.ADMIN_REFRESH_TOKEN;
        }

        return type === TOKEN_TYPE.ACCESS
            ? COOKIE_NAMES.CUSTOMER_ACCESS_TOKEN
            : COOKIE_NAMES.CUSTOMER_REFRESH_TOKEN;
    }

    private getUserMetaData(request: Request) {
        const ipAddress: string =
            request.headers['x-forwarded-for']?.toString().split(',')[0] ??
            (request.socket.remoteAddress as string);
        const userAgent = request.headers['user-agent'] as string;

        return {
            ipAddress,
            userAgent,
        };
    }

    private isRoleAllowed(userRole: USER_ROLES, requestedRole: USER_ROLES): boolean {
        const adminRoles = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN];

        if (userRole === USER_ROLES.CUSTOMER && adminRoles.includes(requestedRole)) return false;

        return !(adminRoles.includes(userRole) && requestedRole === USER_ROLES.CUSTOMER);
    }

    private async setTokens(
        response: Response,
        payload: UserJWTPayload,
        setRefreshToken = true,
    ): Promise<void> {
        try {
            const accessToken: string = this.tokenService.createAccessToken(payload);
            this.setTokenCookie(response, accessToken, TOKEN_TYPE.ACCESS, payload.role);

            if (setRefreshToken) {
                const refreshToken: string = await this.tokenService.createRefreshToken(payload);
                this.setTokenCookie(response, refreshToken, TOKEN_TYPE.REFRESH, payload.role);
            }
        } catch (error) {
            this.handleUnexpectedError(error, 'Failed to set authentication tokens');
        }
    }

    private handleUnexpectedError(error: unknown, message: string): never {
        if (error instanceof HttpException) {
            throw error;
        }

        throw new InternalServerErrorException(message);
    }
}
