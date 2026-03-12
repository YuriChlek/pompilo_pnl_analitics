import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AuthService } from '@/module-auth/services/auth.service';
import type { Request, Response } from 'express';
import { COOKIE_NAMES } from '@/module-auth/constants/auth.constants';
import { LoginAdminDto } from '@/module-admin-auth/dto/login-admin.dto';
import { UserRoles } from '@/module-auth/enums/role.enum';
import { UserPayload } from '@/module-user/interfaces/user.interface';

@Injectable()
export class AdminAuthService {
    public constructor(private readonly authService: AuthService) {}

    async login(response: Response, request: Request, loginAdminDto: LoginAdminDto) {
        return this.authService.login(response, request, loginAdminDto);
    }

    async logout(request: Request, response: Response): Promise<void> {
        await this.authService.logout(request, response, UserRoles.ADMIN);
    }

    async refreshAdminToken(response: Response, request: Request) {
        try {
            return await this.authService.refreshAccessToken(
                response,
                request,
                COOKIE_NAMES.ADMIN_REFRESH_TOKEN,
            );
        } catch (error) {
            if (error instanceof Error) {
                throw new InternalServerErrorException(error.message);
            }

            throw new InternalServerErrorException('An unexpected error occurred');
        }
    }

    getMe(request: Request): UserPayload | null {
        return this.authService.getMe(request, UserRoles.ADMIN);
    }
}
