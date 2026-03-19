import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { JWT_ALGORITHM } from '@/module-auth/constants/auth.constants';
import { AccessTokenPayload } from '@/module-auth-token/interfaces/auth-token.interfaces';
import { COOKIE_NAMES } from '@/module-auth/enums/auth-enums';

@Injectable()
export class JwtCustomerAuthStrategy extends PassportStrategy(Strategy, 'customer-jwt') {
    constructor(private readonly configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request): string | null => {
                    const cookiesKeys: string[] = Object.keys(request.cookies);

                    if (cookiesKeys.includes(COOKIE_NAMES.CUSTOMER_ACCESS_TOKEN)) {
                        return request.cookies[COOKIE_NAMES.CUSTOMER_ACCESS_TOKEN] as string;
                    }

                    return null;
                },
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
            jsonWebTokenOptions: {
                maxAge: configService.getOrThrow<string>('JWT_ACCESS_TOKEN_TTL'),
            },
            algorithms: [JWT_ALGORITHM],
        });
    }

    validate(accessTokenPayload: AccessTokenPayload): AccessTokenPayload | null {
        return accessTokenPayload;
    }
}
