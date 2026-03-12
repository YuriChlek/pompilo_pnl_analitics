import {
    BadRequestException,
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
import { UserRoles } from '@/module-auth/enums/role.enum';
import { COOKIE_NAMES } from '@/module-auth/constants/auth.constants';
import {
    type AccessTokenPayload,
    RefreshTokenVerificationResult,
    TokenType,
} from '@/module-auth-token/interfaces/auth-token.interfaces';

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
            if (error instanceof Error) {
                throw new BadRequestException(error.message);
            }

            throw new InternalServerErrorException('An unexpected error occurred');
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
            if (error instanceof Error) {
                throw new UnauthorizedException(error.message);
            }

            throw new InternalServerErrorException('An unexpected error occurred');
        }
    }

    async logout(request: Request, response: Response, userRole: UserRoles) {
        const cookiesKeys: string[] = Object.keys(request.cookies);
        const accessTokenCookieName: string = this.getCookieName(userRole, TokenType.ACCESS);
        const refreshTokenCookieName: string = this.getCookieName(userRole, TokenType.REFRESH);

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

    getMe(request: Request, userRole: UserRoles): UserPayload | null {
        const cookieName: string = this.getCookieName(userRole, TokenType.ACCESS);
        const userToken: string = request.cookies[cookieName] as string;

        if (userToken) {
            const { userId, email, username, role } = this.tokenService.getTokenData(
                userToken,
            ) as AccessTokenPayload;

            return {
                id: userId,
                email,
                name: username,
                role: role as UserRoles,
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
        type: TokenType,
        userRole: UserRoles,
    ): void {
        try {
            const ttl =
                type === TokenType.ACCESS ? this.JWT_ACCESS_TOKEN_TTL : this.JWT_REFRESH_TOKEN_TTL;
            const ttlMs = ms(ttl);
            const expires = new Date(Date.now() + ttlMs);
            const path: string =
                userRole === UserRoles.ADMIN || userRole === UserRoles.SUPER_ADMIN ? '/admin' : '/';
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
            if (error instanceof Error) {
                throw new InternalServerErrorException(error.message);
            }

            throw new InternalServerErrorException('An unexpected error occurred');
        }
    }

    private removeTokenCookie(response: Response, userRole: UserRoles, tokenName: string): void {
        const path =
            userRole === UserRoles.ADMIN || userRole === UserRoles.SUPER_ADMIN ? '/admin' : '/';

        response.cookie(tokenName, '', {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            domain: this.COOKIE_DOMAIN,
            expires: new Date(0),
            path,
        });
    }

    private getCookieName(userRole: UserRoles, type: TokenType): string {
        const isAdmin: boolean = userRole === UserRoles.ADMIN || userRole === UserRoles.SUPER_ADMIN;

        if (isAdmin) {
            return type === TokenType.ACCESS
                ? COOKIE_NAMES.ADMIN_ACCESS_TOKEN
                : COOKIE_NAMES.ADMIN_REFRESH_TOKEN;
        }

        return type === TokenType.ACCESS
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

    private isRoleAllowed(userRole: UserRoles, requestedRole: UserRoles): boolean {
        const adminRoles = [UserRoles.ADMIN, UserRoles.SUPER_ADMIN];

        if (userRole === UserRoles.CUSTOMER && adminRoles.includes(requestedRole)) return false;

        return !(adminRoles.includes(userRole) && requestedRole === UserRoles.CUSTOMER);
    }

    private async setTokens(
        response: Response,
        payload: UserJWTPayload,
        setRefreshToken = true,
    ): Promise<void> {
        try {
            const accessToken: string = this.tokenService.createAccessToken(payload);
            this.setTokenCookie(response, accessToken, TokenType.ACCESS, payload.role);

            if (setRefreshToken) {
                const refreshToken: string = await this.tokenService.createRefreshToken(payload);
                this.setTokenCookie(response, refreshToken, TokenType.REFRESH, payload.role);
            }
        } catch (error) {
            if (error instanceof Error) {
                throw new InternalServerErrorException(error.message);
            }

            throw new InternalServerErrorException('An unexpected error occurred');
        }
    }
}
