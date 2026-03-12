import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '@/module-auth-token/services/token.service';
import {
    AccessTokenPayload,
    RefreshTokenPayload,
    TokenType,
} from '@/module-auth-token/interfaces/auth-token.interfaces';

describe('TokenService', () => {
    let service: TokenService;
    let jwtService: jest.Mocked<JwtService>;
    let configService: jest.Mocked<ConfigService>;

    beforeEach(() => {
        jwtService = {
            sign: jest.fn().mockReturnValue('signed'),
            verify: jest.fn().mockReturnValue({ userId: 'user-id' }),
        } as unknown as jest.Mocked<JwtService>;
        configService = {
            getOrThrow: jest.fn((key: string) => (key === 'JWT_ACCESS_TOKEN_TTL' ? '15m' : '7d')),
        } as unknown as jest.Mocked<ConfigService>;

        service = new TokenService(configService, jwtService);
    });

    it('creates access tokens with configured ttl', () => {
        const payload = {
            sub: 'user-id',
            userId: 'user-id',
            email: 'john@example.com',
            username: 'john',
            role: 'customer',
            ipAddress: '1.1.1.1',
            userAgent: 'ua',
            type: TokenType.ACCESS,
        } satisfies AccessTokenPayload;

        const token = service.createAccessToken(payload);

        expect(token).toBe('signed');
        expect(jwtService.sign).toHaveBeenCalledWith(payload, { expiresIn: '15m' });
    });

    it('creates refresh tokens with refresh ttl and refresh type', () => {
        const payload = {
            sub: 'user-id',
            userId: 'user-id',
            ipAddress: '1.1.1.1',
            userAgent: 'ua',
            type: TokenType.REFRESH,
            jti: 'id',
        } satisfies RefreshTokenPayload;

        const token = service.createRefreshToken(payload);

        expect(token).toBe('signed');
        expect(jwtService.sign).toHaveBeenCalledWith(
            { ...payload, type: 'refresh' },
            { expiresIn: '7d' },
        );
    });

    it('verifies incoming jwt tokens', () => {
        const decoded = service.verifyToken('token');

        expect(decoded).toEqual({ userId: 'user-id' });
        expect(jwtService.verify).toHaveBeenCalledWith('token');
    });
});
