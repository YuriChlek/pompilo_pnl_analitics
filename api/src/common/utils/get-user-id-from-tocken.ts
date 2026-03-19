import type { Request } from 'express';
import { TokenService } from '@/module-auth-token/services/token.service';
import { COOKIE_NAMES } from '@/module-auth/enums';

export const getUserIdFromToken = (request: Request, tokenService: TokenService): string | null => {
    const token = request.cookies[COOKIE_NAMES.CUSTOMER_ACCESS_TOKEN] as string;

    if (!token) {
        return null;
    }

    const { userId } = tokenService.verifyToken(token);

    return userId;
};
