import {
    HttpException,
    Injectable,
    InternalServerErrorException,
    UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '@/module-user/services/user.service';
import { AuthTokenService } from '@/module-auth-token/services/auth-token.service';
import { UserJWTPayload, UserPayload } from '@/module-user/interfaces/user.interfaces';
import { RegisterUserDto } from '@/module-auth/dto/register-user.dto';
import type { Request, Response } from 'express';
import { LoginUserDto } from '@/module-auth/dto/login-user.dto';
import { User } from '@/module-user/entities/user.entity';
import { Argon2HashUtil } from '@/common/utils/hash.util';
import { USER_ROLES } from '@/module-auth/enums/auth-enums';

import {
    type AccessTokenPayload,
} from '@/module-auth-token/interfaces/auth-token.interfaces';
import { RefreshTokenVerificationResult } from '@/module-auth-token/types/auth-token.types';
import { TOKEN_TYPE } from '@/module-auth-token/enums/auth-token.enums';
import { AuthSessionService } from '@/module-auth/services/auth-session.service';

@Injectable()
export class AuthService {
    public constructor(
        private readonly userService: UserService,
        private readonly tokenService: AuthTokenService,
        private readonly authSessionService: AuthSessionService,
    ) {}

    async register(
        response: Response,
        request: Request,
        registerUserDto: RegisterUserDto,
    ): Promise<UserPayload> {
        try {
            const { id, name, email, role } = await this.userService.create(registerUserDto);
            const { ipAddress, userAgent } = this.authSessionService.getUserMetaData(request);
            const userJWTPayload = {
                id,
                name,
                email,
                role,
                ipAddress,
                userAgent,
            };

            await this.authSessionService.issueTokens(response, userJWTPayload);

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
            const { ipAddress, userAgent } = this.authSessionService.getUserMetaData(request);
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

            await this.authSessionService.issueTokens(response, userJWTPayload);

            return userPayload;
        } catch (error) {
            this.handleUnexpectedError(error, 'Failed to log in user');
        }
    }

    async logout(request: Request, response: Response, userRole: USER_ROLES) {
        const cookiesKeys: string[] = Object.keys(request.cookies);
        const accessTokenCookieName = this.authSessionService.getCookieName(
            userRole,
            TOKEN_TYPE.ACCESS,
        );
        const refreshTokenCookieName = this.authSessionService.getCookieName(
            userRole,
            TOKEN_TYPE.REFRESH,
        );

        if (
            !cookiesKeys.includes(accessTokenCookieName) ||
            !cookiesKeys.includes(refreshTokenCookieName)
        ) {
            throw new UnauthorizedException('Unauthorized user token.');
        }

        const refreshToken = request.cookies[refreshTokenCookieName] as string;
        const { ipAddress, userAgent } = this.authSessionService.getUserMetaData(request);
        const { userId } = this.tokenService.getTokenData(refreshToken);
        const refreshTokenValid: RefreshTokenVerificationResult =
            await this.tokenService.verifyRefreshToken(refreshToken, userAgent, ipAddress);

        if (!refreshTokenValid.verified) {
            throw new UnauthorizedException('Unauthorized user token.');
        }

        this.authSessionService.clearTokens(response, userRole);
        await this.tokenService.removeRefreshToken(userId, userAgent, ipAddress);
    }

    getMe(request: Request, userRole: USER_ROLES): UserPayload | null {
        const cookieName = this.authSessionService.getCookieName(userRole, TOKEN_TYPE.ACCESS);
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
        const { ipAddress, userAgent } = this.authSessionService.getUserMetaData(request);

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
            await this.authSessionService.issueTokens(response, userJWTPayload, false);

            return true;
        }

        return false;
    }

    private isRoleAllowed(userRole: USER_ROLES, requestedRole: USER_ROLES): boolean {
        const adminRoles = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN];

        if (userRole === USER_ROLES.CUSTOMER && adminRoles.includes(requestedRole)) return false;

        return !(adminRoles.includes(userRole) && requestedRole === USER_ROLES.CUSTOMER);
    }

    private handleUnexpectedError(error: unknown, message: string): never {
        if (error instanceof HttpException) {
            throw error;
        }

        throw new InternalServerErrorException(message);
    }
}
