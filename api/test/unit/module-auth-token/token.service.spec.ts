import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '@/module-auth-token/services/token.service';
import {
    AccessTokenPayload,
    RefreshTokenPayload,
} from '@/module-auth-token/interfaces/auth-token.interfaces';
import { TOKEN_TYPE } from '@/module-auth-token/enums/auth-token-enums';

describe('TokenService', () => {
    let service: TokenService;
    let jwtService: {
        sign: jest.MockedFunction<JwtService['sign']>;
        verify: jest.MockedFunction<JwtService['verify']>;
    };
    let configService: {
        getOrThrow: jest.MockedFunction<ConfigService['getOrThrow']>;
    };

    beforeEach(() => {
        jwtService = {
            sign: jest.fn().mockReturnValue('signed'),
            verify: jest.fn().mockReturnValue({ userId: 'user-id' }),
        };
        configService = {
            getOrThrow: jest.fn((key: string) => (key === 'JWT_ACCESS_TOKEN_TTL' ? '15m' : '7d')),
        };

        service = new TokenService(
            configService as unknown as ConfigService,
            jwtService as unknown as JwtService,
        );
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
            type: TOKEN_TYPE.ACCESS,
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
            type: TOKEN_TYPE.REFRESH,
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
