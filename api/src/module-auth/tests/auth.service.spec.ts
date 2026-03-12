import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from '@/module-auth/services/auth.service';
import { UserService } from '@/module-user/services/user.service';
import { AuthTokenService } from '@/module-auth-token/services/auth-token.service';
import { RegisterUserDto } from '@/module-auth/dto/register-user.dto';
import { LoginUserDto } from '@/module-auth/dto/login-user.dto';
import { UserRoles } from '@/module-auth/enums/role.enum';
import { Argon2HashUtil } from '@/common/utils/hash.util';
import { COOKIE_NAMES } from '@/module-auth/constants/auth.constants';

jest.mock('@/common/utils/hash.util', () => ({
    Argon2HashUtil: {
        hash: jest.fn(),
        compare: jest.fn(),
    },
}));

const createRequest = (overrides?: Partial<Request>): Request =>
    ({
        cookies: {},
        headers: {
            'x-forwarded-for': '203.0.113.1',
            'user-agent': 'Jest',
        },
        socket: {
            remoteAddress: '10.0.0.1',
        },
        ...overrides,
    }) as Request;

const createResponse = (): Response =>
    ({
        cookie: jest.fn(),
    }) as unknown as Response;

describe('AuthService', () => {
    let service: AuthService;
    let userService: jest.Mocked<UserService>;
    let tokenService: jest.Mocked<AuthTokenService>;
    let configService: jest.Mocked<ConfigService>;
    let response: Response;
    let request: Request;

    const registerDto: RegisterUserDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'Secret123',
    } as RegisterUserDto;

    const loginDto: LoginUserDto = {
        login: 'john.doe@example.com',
        password: 'Secret123',
        role: UserRoles.CUSTOMER,
    };

    beforeEach(() => {
        userService = {
            create: jest.fn(),
            findByLogin: jest.fn(),
        } as unknown as jest.Mocked<UserService>;

        tokenService = {
            createAccessToken: jest.fn().mockReturnValue('access-token'),
            createRefreshToken: jest.fn().mockResolvedValue('refresh-token'),
            verifyRefreshToken: jest
                .fn()
                .mockResolvedValue({ verified: true, user: { id: 'user-id' } }),
            removeRefreshToken: jest.fn(),
            getTokenData: jest.fn().mockReturnValue({ userId: 'user-id' }),
        } as unknown as jest.Mocked<AuthTokenService>;

        configService = {
            getOrThrow: jest.fn((key: string) => {
                switch (key) {
                    case 'COOKIE_DOMAIN':
                        return '.example.com';
                    case 'JWT_ACCESS_TOKEN_TTL':
                        return '15m';
                    case 'JWT_REFRESH_TOKEN_TTL':
                        return '7d';
                    default:
                        throw new Error('Missing key');
                }
            }),
        } as unknown as jest.Mocked<ConfigService>;

        service = new AuthService(userService, tokenService, configService);
        response = createResponse();
        request = createRequest();
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('registers a new user and sets cookies', async () => {
            userService.create.mockResolvedValue({
                id: 'user-id',
                name: 'John Doe',
                email: 'john.doe@example.com',
                role: UserRoles.CUSTOMER,
            } as never);

            const result = await service.register(response, request, registerDto);

            expect(userService.create).toHaveBeenCalledWith(registerDto);
            expect(tokenService.createAccessToken).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'user-id',
                    ipAddress: '203.0.113.1',
                    userAgent: 'Jest',
                }),
            );
            expect(tokenService.createRefreshToken).toHaveBeenCalled();
            expect((response.cookie as jest.Mock).mock.calls).toHaveLength(2);
            expect(result).toEqual({
                id: 'user-id',
                name: 'John Doe',
                email: 'john.doe@example.com',
                role: UserRoles.CUSTOMER,
            });
        });

        it('wraps repository errors into BadRequestException', async () => {
            userService.create.mockRejectedValue(new Error('duplicate'));

            await expect(service.register(response, request, registerDto)).rejects.toBeInstanceOf(
                BadRequestException,
            );
        });
    });

    describe('login', () => {
        const baseUser = {
            id: 'user-id',
            name: 'John Doe',
            email: 'john.doe@example.com',
            password: 'hash',
            isActive: true,
            role: UserRoles.CUSTOMER,
        } as const;

        beforeEach(() => {
            (Argon2HashUtil.compare as jest.Mock).mockResolvedValue(true);
        });

        it('logs user in when credentials are valid and role is allowed', async () => {
            userService.findByLogin.mockResolvedValue(baseUser as never);

            const result = await service.login(response, request, loginDto);

            expect(userService.findByLogin).toHaveBeenCalledWith(loginDto.login);
            expect(Argon2HashUtil.compare).toHaveBeenCalledWith(
                loginDto.password,
                baseUser.password,
            );
            expect(tokenService.createAccessToken).toHaveBeenCalled();
            expect(tokenService.createRefreshToken).toHaveBeenCalled();
            expect(result).toEqual({
                id: 'user-id',
                name: 'John Doe',
                email: baseUser.email,
                role: baseUser.role,
            });
        });

        it('throws UnauthorizedException when password does not match', async () => {
            userService.findByLogin.mockResolvedValue(baseUser as never);
            (Argon2HashUtil.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login(response, request, loginDto)).rejects.toBeInstanceOf(
                UnauthorizedException,
            );
        });

        it('rejects when requested role is not allowed for the user', async () => {
            userService.findByLogin.mockResolvedValue({
                ...baseUser,
                role: UserRoles.ADMIN,
            } as never);

            await expect(service.login(response, request, loginDto)).rejects.toBeInstanceOf(
                UnauthorizedException,
            );
        });
    });

    describe('logout', () => {
        it('revokes refresh tokens and clears cookies', async () => {
            const logoutRequest = createRequest({
                cookies: {
                    [COOKIE_NAMES.CUSTOMER_ACCESS_TOKEN]: 'access-token',
                    [COOKIE_NAMES.CUSTOMER_REFRESH_TOKEN]: 'refresh-token',
                },
            });

            tokenService.verifyRefreshToken.mockResolvedValue({
                verified: true,
                user: {
                    id: 'user-id',
                    name: 'John',
                    email: 'john@example.com',
                    role: UserRoles.CUSTOMER,
                },
            });

            await service.logout(logoutRequest, response, UserRoles.CUSTOMER);

            expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(
                'refresh-token',
                'Jest',
                '203.0.113.1',
            );
            expect(tokenService.removeRefreshToken).toHaveBeenCalledWith(
                'user-id',
                'Jest',
                '203.0.113.1',
            );
            expect((response.cookie as jest.Mock).mock.calls).toEqual([
                [
                    COOKIE_NAMES.CUSTOMER_ACCESS_TOKEN,
                    '',
                    expect.objectContaining({ expires: new Date(0) }),
                ],
                [
                    COOKIE_NAMES.CUSTOMER_REFRESH_TOKEN,
                    '',
                    expect.objectContaining({ expires: new Date(0) }),
                ],
            ]);
        });

        it('throws UnauthorizedException when required cookies are missing', async () => {
            const badRequest = createRequest({ cookies: {} });

            await expect(
                service.logout(badRequest, response, UserRoles.CUSTOMER),
            ).rejects.toBeInstanceOf(UnauthorizedException);
        });
    });

    describe('getMe', () => {
        it('returns decoded payload when access token exists', () => {
            const meRequest = createRequest({
                cookies: {
                    [COOKIE_NAMES.CUSTOMER_ACCESS_TOKEN]: 'access-token',
                },
            });

            tokenService.getTokenData.mockReturnValue({
                userId: 'user-id',
                email: 'john@example.com',
                username: 'John',
                role: UserRoles.CUSTOMER,
            } as never);

            const result = service.getMe(meRequest, UserRoles.CUSTOMER);

            expect(result).toEqual({
                id: 'user-id',
                email: 'john@example.com',
                name: 'John',
                role: UserRoles.CUSTOMER,
            });
        });

        it('returns null when access token is missing', () => {
            const result = service.getMe(request, UserRoles.CUSTOMER);

            expect(result).toBeNull();
        });
    });

    describe('refreshAccessToken', () => {
        it('re-issues access token when refresh token is valid', async () => {
            const refreshRequest = createRequest({
                cookies: {
                    [COOKIE_NAMES.CUSTOMER_REFRESH_TOKEN]: 'refresh-token',
                },
            });

            tokenService.verifyRefreshToken.mockResolvedValue({
                verified: true,
                user: {
                    id: 'user-id',
                    name: 'John Doe',
                    email: 'john@example.com',
                    role: UserRoles.CUSTOMER,
                },
            });

            const result = await service.refreshAccessToken(
                response,
                refreshRequest,
                COOKIE_NAMES.CUSTOMER_REFRESH_TOKEN,
            );

            expect(result).toBe(true);
            expect(tokenService.createAccessToken).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'user-id',
                    ipAddress: '203.0.113.1',
                    userAgent: 'Jest',
                }),
            );
            expect(tokenService.createRefreshToken).not.toHaveBeenCalled();
            expect((response.cookie as jest.Mock).mock.calls).toHaveLength(1);
        });

        it('returns false when refresh token cookie is missing', async () => {
            const result = await service.refreshAccessToken(response, request, 'missing');

            expect(result).toBe(false);
            expect(tokenService.verifyRefreshToken).not.toHaveBeenCalled();
        });

        it('returns false when verification fails', async () => {
            const refreshRequest = createRequest({
                cookies: {
                    any: 'token',
                },
            });

            tokenService.verifyRefreshToken.mockResolvedValue({ verified: false });

            const result = await service.refreshAccessToken(response, refreshRequest, 'any');

            expect(result).toBe(false);
            expect(tokenService.createAccessToken).not.toHaveBeenCalled();
        });
    });
});
