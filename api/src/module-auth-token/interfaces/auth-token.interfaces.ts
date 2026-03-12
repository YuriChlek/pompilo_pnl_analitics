import { User } from '@/module-user/entities/user.entity';

export enum TokenType {
    ACCESS = 'access',
    REFRESH = 'refresh',
}

export type RefreshTokenVerificationResult =
    | { verified: true; user: Partial<User> }
    | { verified: false; user?: never };

interface BaseTokenMeta {
    ipAddress: string;
    userAgent: string;
}

interface JwtPayloadBase<T extends TokenType> extends BaseTokenMeta {
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
export interface RefreshTokenPayload extends JwtPayloadBase<TokenType.REFRESH> {
    jti: string;
}

export interface AccessTokenPayload extends JwtPayloadBase<TokenType.ACCESS> {
    email: string;
    username: string;
    role: string | string[];
}
