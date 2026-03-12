import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { AdminAuthService } from './services/admin-auth.service';
import type { Request, Response } from 'express';
import { UserPayload } from '@/module-user/interfaces/user.interface';
import { LoginAdminDto } from '@/module-admin-auth/dto/login-admin.dto';

@Controller()
export class AdminAuthController {
    constructor(private readonly adminAuthService: AdminAuthService) {}

    @Post('login')
    login(
        @Res({ passthrough: true }) response: Response,
        @Req() request: Request,
        @Body() loginAdminDto: LoginAdminDto,
    ): Promise<UserPayload> {
        return this.adminAuthService.login(response, request, loginAdminDto);
    }

    @Post('logout')
    logout(@Res({ passthrough: true }) response: Response, @Req() request: Request) {
        return this.adminAuthService.logout(request, response);
    }

    @Post('refresh')
    refreshAdminToken(@Res({ passthrough: true }) response: Response, @Req() request: Request) {
        return this.adminAuthService.refreshAdminToken(response, request);
    }

    @Post('me')
    getMe(@Req() request: Request) {
        return this.adminAuthService.getMe(request);
    }
}
