import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { AuthTokenService } from '@/module-auth-token/services/auth-token.service';
import { TokenService } from '@/module-auth-token/services/token.service';
import { AuthTokenRepositoryService } from '@/module-auth-token/services/auth-token.repository.service';
import { UserJWTPayload } from '@/module-user/interfaces/user.interfaces';
import { USER_ROLES } from '@/module-auth/enums/auth-enums';
import { TOKEN_TYPE } from '@/module-auth-token/enums/auth-token.enums';
import { AuthTokenPayloadService } from '@/module-auth-token/services/auth-token-payload.service';
import { RefreshTokenVerificationService } from '@/module-auth-token/services/refresh-token-verification.service';
import { RefreshTokenStorageService } from '@/module-auth-token/services/refresh-token-storage.service';

type AwaitedReturn<T> = T extends Promise<infer R> ? R : T;

describe('AuthTokenService', () => {
    let service: AuthTokenService;
    let tokenService: {
        createAccessToken: jest.MockedFunction<TokenService['createAccessToken']>;
        createRefreshToken: jest.MockedFunction<TokenService['createRefreshToken']>;
        verifyToken: jest.MockedFunction<TokenService['verifyToken']>;
    };
    let repository: {
        removeRefreshToken: jest.MockedFunction<AuthTokenRepositoryService['removeRefreshToken']>;
    };
    let payloadService: {
        createAccessTokenPayload: jest.MockedFunction<
            AuthTokenPayloadService['createAccessTokenPayload']
        >;
        createRefreshTokenPayload: jest.MockedFunction<
            AuthTokenPayloadService['createRefreshTokenPayload']
        >;
    };
    let refreshTokenVerificationService: {
        verify: jest.MockedFunction<RefreshTokenVerificationService['verify']>;
    };
    let refreshTokenStorageService: {
        saveRefreshToken: jest.MockedFunction<RefreshTokenStorageService['saveRefreshToken']>;
    };

    const userPayload: UserJWTPayload = {
        id: 'user-id',
        name: 'John Doe',
        email: 'john@example.com',
        role: USER_ROLES.CUSTOMER,
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
            removeRefreshToken: jest.fn(),
        };

        payloadService = {
            createAccessTokenPayload: jest.fn().mockReturnValue({
                sub: userPayload.id,
                userId: userPayload.id,
                email: userPayload.email,
                username: userPayload.name,
                role: userPayload.role,
                ipAddress: userPayload.ipAddress,
                userAgent: 'mac chrome',
                type: TOKEN_TYPE.ACCESS,
            }),
            createRefreshTokenPayload: jest.fn().mockReturnValue({
                sub: userPayload.id,
                userId: userPayload.id,
                userAgent: 'mac chrome',
                ipAddress: userPayload.ipAddress,
                type: TOKEN_TYPE.REFRESH,
                jti: 'refresh-jti',
            }),
        };

        refreshTokenVerificationService = {
            verify: jest.fn(),
        };
        refreshTokenStorageService = {
            saveRefreshToken: jest.fn(),
        };

        service = new AuthTokenService(
            tokenService as unknown as TokenService,
            repository as unknown as AuthTokenRepositoryService,
            payloadService as unknown as AuthTokenPayloadService,
            refreshTokenVerificationService as unknown as RefreshTokenVerificationService,
            refreshTokenStorageService as unknown as RefreshTokenStorageService,
        );
        jest.clearAllMocks();
    });

    describe('createAccessToken', () => {
        it('delegates to tokenService with mapped payload', () => {
            const token = service.createAccessToken(userPayload);

            expect(payloadService.createAccessTokenPayload).toHaveBeenCalledWith(userPayload);
            expect(tokenService.createAccessToken).toHaveBeenCalledWith(
                expect.objectContaining({
                    sub: userPayload.id,
                    type: TOKEN_TYPE.ACCESS,
                }),
            );
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
            expect(payloadService.createRefreshTokenPayload).toHaveBeenCalledWith(userPayload);
            expect(refreshTokenStorageService.saveRefreshToken).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: userPayload.id,
                    ipAddress: userPayload.ipAddress,
                    userAgent: 'mac chrome',
                }),
                'refresh-token',
            );
        });

        it('throws InternalServerErrorException on persistence errors', async () => {
            refreshTokenStorageService.saveRefreshToken.mockRejectedValue(new Error('db error'));

            await expect(service.createRefreshToken(userPayload)).rejects.toBeInstanceOf(
                InternalServerErrorException,
            );
        });
    });

    describe('verifyRefreshToken', () => {
        it('returns user info when stored token matches', async () => {
            refreshTokenVerificationService.verify.mockResolvedValue({
                verified: true,
                user: { id: 'user-id', email: 'john@example.com' } as any,
            });

            const result = await service.verifyRefreshToken(
                'token',
                'Mac Chrome',
                userPayload.ipAddress,
            );

            expect(result).toEqual({
                verified: true,
                user: { id: 'user-id', email: 'john@example.com' },
            });
            expect(refreshTokenVerificationService.verify).toHaveBeenCalledWith(
                'token',
                'Mac Chrome',
                userPayload.ipAddress,
            );
        });

        it('rethrows verification errors', async () => {
            refreshTokenVerificationService.verify.mockRejectedValue(
                new BadRequestException('Refresh token not found.'),
            );

            await expect(
                service.verifyRefreshToken('token', 'ua', userPayload.ipAddress),
            ).rejects.toBeInstanceOf(BadRequestException);
        });

        it('returns false when token metadata not found', async () => {
            refreshTokenVerificationService.verify.mockResolvedValue({ verified: false });

            const result = await service.verifyRefreshToken('token', 'ua', userPayload.ipAddress);

            expect(result).toEqual({ verified: false });
        });
    });

    it('removes refresh tokens by delegating to repository', async () => {
        await service.removeRefreshToken('user-id', 'ua', '127.0.0.1');

        expect(repository.removeRefreshToken).toHaveBeenCalledWith('user-id', 'ua', '127.0.0.1');
    });
});
