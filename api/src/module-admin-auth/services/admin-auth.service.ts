import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { AuthService } from '@/module-auth/services/auth.service';
import type { Request, Response } from 'express';
import { LoginAdminDto } from '@/module-admin-auth/dto/login-admin.dto';
import { USER_ROLES, COOKIE_NAMES } from '@/module-auth/enums/auth-enums';
import { UserPayload } from '@/module-user/interfaces/user.interfaces';

@Injectable()
export class AdminAuthService {
    public constructor(private readonly authService: AuthService) {}

    async login(response: Response, request: Request, loginAdminDto: LoginAdminDto) {
        return this.authService.login(response, request, loginAdminDto);
    }

    async logout(request: Request, response: Response): Promise<void> {
        await this.authService.logout(request, response, USER_ROLES.ADMIN);
    }

    async refreshAdminToken(response: Response, request: Request) {
        try {
            return await this.authService.refreshAccessToken(
                response,
                request,
                COOKIE_NAMES.ADMIN_REFRESH_TOKEN,
            );
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            throw new InternalServerErrorException('Failed to refresh admin token');
        }
    }

    getMe(request: Request): UserPayload | null {
        return this.authService.getMe(request, USER_ROLES.ADMIN);
    }
}
