import { User } from '@/module-user/entities/user.entity';
import { TOKEN_TYPE } from '@/module-auth-token/enums/auth-token-enums';

export type RefreshTokenVerificationResult =
    | { verified: true; user: Partial<User> }
    | { verified: false; user?: never };

interface BaseTokenMeta {
    ipAddress: string;
    userAgent: string;
}

interface JwtPayloadBase<T extends TOKEN_TYPE> extends BaseTokenMeta {
    sub: string;
    userId: string;
    type: T;
}

/** ===== DB ===== */
export interface TokenFromDbPayload extends BaseTokenMeta {
    refreshToken: string;
    user?: Partial<User>;
}

/** ===== JWT ===== */
export interface RefreshTokenPayload extends JwtPayloadBase<TOKEN_TYPE.REFRESH> {
    jti: string;
}

export interface AccessTokenPayload extends JwtPayloadBase<TOKEN_TYPE.ACCESS> {
    email: string;
    username: string;
    role: string | string[];
}
