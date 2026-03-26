import {
    ConflictException,
    InternalServerErrorException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from '@/module-auth/services/auth.service';
import { UserService } from '@/module-user/services/user.service';
import { AuthTokenService } from '@/module-auth-token/services/auth-token.service';
import { COOKIE_NAMES, USER_ROLES } from '@/module-auth/enums/auth-enums';
import { Argon2HashUtil } from '@/common/utils/hash.util';
import { buildRegisterDto, buildLoginDto } from '../../fixtures/auth.fixtures';

type AwaitedReturn<T> = T extends Promise<infer R> ? R : T;
const hashMock = jest.spyOn(Argon2HashUtil, 'hash');
const compareMock = jest.spyOn(Argon2HashUtil, 'compare');

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
    let userService: {
        create: jest.MockedFunction<UserService['create']>;
        findByLogin: jest.MockedFunction<UserService['findByLogin']>;
    };
    let tokenService: {
        createAccessToken: jest.MockedFunction<AuthTokenService['createAccessToken']>;
        createRefreshToken: jest.MockedFunction<AuthTokenService['createRefreshToken']>;
        verifyRefreshToken: jest.MockedFunction<AuthTokenService['verifyRefreshToken']>;
        removeRefreshToken: jest.MockedFunction<AuthTokenService['removeRefreshToken']>;
        getTokenData: jest.MockedFunction<AuthTokenService['getTokenData']>;
    };
    let configService: Pick<ConfigService, 'getOrThrow'>;
    let response: Response;
    let request: Request;

    const registerDto = buildRegisterDto();
    const loginDto = buildLoginDto({ login: registerDto.email, role: USER_ROLES.CUSTOMER });

    beforeEach(() => {
        userService = {
            create: jest.fn(),
            findByLogin: jest.fn(),
        };

        tokenService = {
            createAccessToken: jest.fn().mockReturnValue('access-token'),
            createRefreshToken: jest.fn().mockResolvedValue('refresh-token'),
            verifyRefreshToken: jest
                .fn()
                .mockResolvedValue({ verified: true, user: { id: 'user-id' } }),
            removeRefreshToken: jest.fn(),
            getTokenData: jest.fn().mockReturnValue({ userId: 'user-id' }),
        };

        configService = {
            getOrThrow: ((key: string) => {
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
            }) as ConfigService['getOrThrow'],
        };

        service = new AuthService(
            userService as unknown as UserService,
            tokenService as unknown as AuthTokenService,
            configService as unknown as ConfigService,
        );
        response = createResponse();
        request = createRequest();
        jest.clearAllMocks();
        hashMock.mockResolvedValue('hashed');
        compareMock.mockReset();
    });

    describe('register', () => {
        it('registers a new user and sets cookies', async () => {
            userService.create.mockResolvedValue({
                id: 'user-id',
                name: 'John Doe',
                email: 'john.doe@example.com',
                role: USER_ROLES.CUSTOMER,
            } as AwaitedReturn<ReturnType<UserService['create']>>);

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
                role: USER_ROLES.CUSTOMER,
            });
        });

        it('converts unexpected errors into InternalServerErrorException', async () => {
            userService.create.mockRejectedValue(new Error('duplicate'));

            await expect(service.register(response, request, registerDto)).rejects.toBeInstanceOf(
                InternalServerErrorException,
            );
        });

        it('preserves ConflictException thrown by UserService', async () => {
            const conflictError = new ConflictException('exists');
            userService.create.mockRejectedValue(conflictError);

            await expect(service.register(response, request, registerDto)).rejects.toBe(
                conflictError,
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
            role: USER_ROLES.CUSTOMER,
        } as const;

        beforeEach(() => {
            compareMock.mockResolvedValue(true);
        });

        it('logs user in when credentials are valid and role is allowed', async () => {
            userService.findByLogin.mockResolvedValue(
                baseUser as AwaitedReturn<ReturnType<UserService['findByLogin']>>,
            );

            const result = await service.login(response, request, loginDto);

            expect(userService.findByLogin).toHaveBeenCalledWith(loginDto.login);
            expect(compareMock).toHaveBeenCalledWith(loginDto.password, baseUser.password);
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
            userService.findByLogin.mockResolvedValue(
                baseUser as AwaitedReturn<ReturnType<UserService['findByLogin']>>,
            );
            compareMock.mockResolvedValue(false);

            await expect(service.login(response, request, loginDto)).rejects.toBeInstanceOf(
                UnauthorizedException,
            );
        });

        it('rejects when requested role is not allowed for the user', async () => {
            userService.findByLogin.mockResolvedValue({
                ...baseUser,
                role: USER_ROLES.ADMIN,
            } as AwaitedReturn<ReturnType<UserService['findByLogin']>>);

            await expect(service.login(response, request, loginDto)).rejects.toBeInstanceOf(
                UnauthorizedException,
            );
        });

        it('converts unexpected repository errors into InternalServerErrorException', async () => {
            userService.findByLogin.mockRejectedValue(new Error('db down'));

            await expect(service.login(response, request, loginDto)).rejects.toBeInstanceOf(
                InternalServerErrorException,
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
                    role: USER_ROLES.CUSTOMER,
                },
            });

            await service.logout(logoutRequest, response, USER_ROLES.CUSTOMER);

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
                service.logout(badRequest, response, USER_ROLES.CUSTOMER),
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
                role: USER_ROLES.CUSTOMER,
            } as ReturnType<AuthTokenService['getTokenData']>);

            const result = service.getMe(meRequest, USER_ROLES.CUSTOMER);

            expect(result).toEqual({
                id: 'user-id',
                email: 'john@example.com',
                name: 'John',
                role: USER_ROLES.CUSTOMER,
            });
        });

        it('returns null when access token is missing', () => {
            const result = service.getMe(request, USER_ROLES.CUSTOMER);

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
                    role: USER_ROLES.CUSTOMER,
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
