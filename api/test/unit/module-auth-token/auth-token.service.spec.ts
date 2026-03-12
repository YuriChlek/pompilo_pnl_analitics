import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { AuthTokenService } from '@/module-auth-token/services/auth-token.service';
import { TokenService } from '@/module-auth-token/services/token.service';
import { AuthTokenRepositoryService } from '@/module-auth-token/services/auth-token.repository.service';
import { UserJWTPayload } from '@/module-user/interfaces/user.interface';
import { UserRoles } from '@/module-auth/enums/role.enum';
import { Argon2HashUtil } from '@/common/utils/hash.util';
import { TokenType } from '@/module-auth-token/interfaces/auth-token.interfaces';

jest.mock('@/common/utils/hash.util', () => ({
    Argon2HashUtil: {
        compare: jest.fn(),
        hash: jest.fn(),
    },
}));

const randomBytesMock = jest.fn<Buffer, [number]>();

jest.mock('crypto', () => ({
    randomBytes: (...args: Parameters<typeof randomBytesMock>) => randomBytesMock(...args),
}));

type AwaitedReturn<T> = T extends Promise<infer R> ? R : T;

describe('AuthTokenService', () => {
    let service: AuthTokenService;
    let tokenService: {
        createAccessToken: jest.MockedFunction<TokenService['createAccessToken']>;
        createRefreshToken: jest.MockedFunction<TokenService['createRefreshToken']>;
        verifyToken: jest.MockedFunction<TokenService['verifyToken']>;
    };
    let repository: {
        saveRefreshTokenData: jest.MockedFunction<
            AuthTokenRepositoryService['saveRefreshTokenData']
        >;
        findRefreshToken: jest.MockedFunction<AuthTokenRepositoryService['findRefreshToken']>;
        removeRefreshToken: jest.MockedFunction<AuthTokenRepositoryService['removeRefreshToken']>;
    };

    const userPayload: UserJWTPayload = {
        id: 'user-id',
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRoles.CUSTOMER,
        ipAddress: '203.0.113.1',
        userAgent: 'Mac Chrome',
    };

    beforeEach(() => {
        tokenService = {
            createAccessToken: jest.fn().mockReturnValue('signed-access'),
            createRefreshToken: jest.fn().mockReturnValue('signed-refresh'),
            verifyToken: jest.fn(),
        };

        repository = {
            saveRefreshTokenData: jest.fn(),
            findRefreshToken: jest.fn(),
            removeRefreshToken: jest.fn(),
        };

        service = new AuthTokenService(
            tokenService as unknown as TokenService,
            repository as unknown as AuthTokenRepositoryService,
        );
        randomBytesMock.mockReturnValue(Buffer.alloc(64, 'a'));
        jest.clearAllMocks();
    });

    describe('createAccessToken', () => {
        it('delegates to tokenService with mapped payload', () => {
            const token = service.createAccessToken(userPayload);

            expect(tokenService.createAccessToken).toHaveBeenCalledWith({
                sub: userPayload.id,
                userId: userPayload.id,
                email: userPayload.email,
                username: userPayload.name,
                role: userPayload.role,
                ipAddress: userPayload.ipAddress,
                userAgent: 'mac chrome',
                type: TokenType.ACCESS,
            });
            expect(token).toBe('signed-access');
        });

        it('wraps unexpected failures into InternalServerErrorException', () => {
            tokenService.createAccessToken.mockImplementation(() => {
                throw new Error('failed');
            });

            expect(() => service.createAccessToken(userPayload)).toThrow(
                InternalServerErrorException,
            );
        });
    });

    describe('createRefreshToken', () => {
        it('persists refresh token metadata', async () => {
            tokenService.createRefreshToken.mockReturnValue('refresh-token');

            const token = await service.createRefreshToken(userPayload);

            expect(token).toBe('refresh-token');
            expect(repository.saveRefreshTokenData).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: userPayload.id,
                    ipAddress: userPayload.ipAddress,
                    userAgent: 'mac chrome',
                }),
                'refresh-token',
            );
            expect(randomBytesMock).toHaveBeenCalledWith(64);
        });

        it('throws InternalServerErrorException on persistence errors', async () => {
            repository.saveRefreshTokenData.mockRejectedValue(new Error('db error'));

            await expect(service.createRefreshToken(userPayload)).rejects.toBeInstanceOf(
                InternalServerErrorException,
            );
        });
    });

    describe('verifyRefreshToken', () => {
        const payload = {
            type: TokenType.REFRESH,
            userId: 'user-id',
            ipAddress: '203.0.113.1',
            userAgent: 'mac chrome',
        } as const;

        beforeEach(() => {
            tokenService.verifyToken.mockReturnValue(
                payload as ReturnType<TokenService['verifyToken']>,
            );
        });

        it('returns user info when stored token matches', async () => {
            repository.findRefreshToken.mockResolvedValue({
                refreshToken: 'stored-hash',
                ipAddress: payload.ipAddress,
                userAgent: 'mac chrome',
                user: { id: 'user-id', email: 'john@example.com' },
            } as AwaitedReturn<ReturnType<AuthTokenRepositoryService['findRefreshToken']>>);
            (Argon2HashUtil.compare as jest.Mock).mockResolvedValue(true);

            const result = await service.verifyRefreshToken(
                'token',
                'Mac Chrome',
                payload.ipAddress,
            );

            expect(result).toEqual({
                verified: true,
                user: { id: 'user-id', email: 'john@example.com' },
            });
            expect(repository.findRefreshToken).toHaveBeenCalledWith(
                payload.userId,
                payload.ipAddress,
                payload.userAgent,
                true,
            );
        });

        it('throws when tokenService cannot decode token', async () => {
            tokenService.verifyToken.mockReturnValue(
                undefined as ReturnType<TokenService['verifyToken']>,
            );

            await expect(
                service.verifyRefreshToken('token', 'ua', payload.ipAddress),
            ).rejects.toBeInstanceOf(BadRequestException);
        });

        it('returns false when token metadata not found', async () => {
            repository.findRefreshToken.mockResolvedValue(
                null as AwaitedReturn<ReturnType<AuthTokenRepositoryService['findRefreshToken']>>,
            );

            const result = await service.verifyRefreshToken('token', 'ua', payload.ipAddress);

            expect(result).toEqual({ verified: false });
        });

        it('returns false when fingerprint does not match', async () => {
            repository.findRefreshToken.mockResolvedValue({
                refreshToken: 'hash',
                ipAddress: payload.ipAddress,
                userAgent: 'different-agent',
            } as AwaitedReturn<ReturnType<AuthTokenRepositoryService['findRefreshToken']>>);

            const result = await service.verifyRefreshToken(
                'token',
                'Mac Chrome',
                payload.ipAddress,
            );

            expect(result).toEqual({ verified: false });
        });

        it('returns false when hash comparison fails', async () => {
            repository.findRefreshToken.mockResolvedValue({
                refreshToken: 'hash',
                ipAddress: payload.ipAddress,
                userAgent: 'mac chrome',
            } as AwaitedReturn<ReturnType<AuthTokenRepositoryService['findRefreshToken']>>);
            (Argon2HashUtil.compare as jest.Mock).mockResolvedValue(false);

            const result = await service.verifyRefreshToken(
                'token',
                'Mac Chrome',
                payload.ipAddress,
            );

            expect(result).toEqual({ verified: false });
        });
    });

    it('removes refresh tokens by delegating to repository', async () => {
        await service.removeRefreshToken('user-id', 'ua', '127.0.0.1');

        expect(repository.removeRefreshToken).toHaveBeenCalledWith('user-id', 'ua', '127.0.0.1');
    });
});
