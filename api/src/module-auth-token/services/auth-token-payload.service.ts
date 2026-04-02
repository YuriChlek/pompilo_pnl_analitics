import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
    type AccessTokenPayload,
    RefreshTokenPayload,
} from '@/module-auth-token/interfaces/auth-token.interfaces';
import { TOKEN_TYPE } from '@/module-auth-token/enums/auth-token.enums';
import { UserJWTPayload } from '@/module-user/interfaces/user.interfaces';
import { normalizeStr } from '@/common/utils/string.utils';

@Injectable()
export class AuthTokenPayloadService {
    createAccessTokenPayload(user: UserJWTPayload): AccessTokenPayload {
        return {
            sub: user.id,
            userId: user.id,
            email: user.email,
            username: user.name,
            role: user.role,
            ipAddress: user.ipAddress,
            userAgent: normalizeStr(user.userAgent),
            type: TOKEN_TYPE.ACCESS,
        };
    }

    createRefreshTokenPayload(user: UserJWTPayload): RefreshTokenPayload {
        return {
            sub: user.id,
            userId: user.id,
            userAgent: normalizeStr(user.userAgent),
            ipAddress: user.ipAddress,
            type: TOKEN_TYPE.REFRESH,
            jti: randomBytes(64).toString('hex'),
        };
    }
}
