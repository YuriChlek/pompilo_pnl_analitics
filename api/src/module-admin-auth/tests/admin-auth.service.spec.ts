import { InternalServerErrorException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AdminAuthService } from '@/module-admin-auth/services/admin-auth.service';
import { AuthService } from '@/module-auth/services/auth.service';
import { COOKIE_NAMES } from '@/module-auth/constants/auth.constants';
import { UserRoles } from '@/module-auth/enums/role.enum';

describe('AdminAuthService', () => {
    let service: AdminAuthService;
    let authService: jest.Mocked<AuthService>;
    const request = {} as Request;
    const response = {} as Response;

    beforeEach(() => {
        authService = {
            login: jest.fn(),
            logout: jest.fn(),
            refreshAccessToken: jest.fn().mockResolvedValue(true),
            getMe: jest.fn().mockReturnValue({ id: 'admin' }),
        } as unknown as jest.Mocked<AuthService>;

        service = new AdminAuthService(authService);
    });

    it('logs admin in by delegating to AuthService', async () => {
        const dto = { login: 'admin' } as any;

        await service.login(response, request, dto);

        expect(authService.login).toHaveBeenCalledWith(response, request, dto);
    });

    it('logs admin out with the admin role', async () => {
        await service.logout(request, response);

        expect(authService.logout).toHaveBeenCalledWith(request, response, UserRoles.ADMIN);
    });

    it('refreshes admin token using the admin cookie', async () => {
        await service.refreshAdminToken(response, request);

        expect(authService.refreshAccessToken).toHaveBeenCalledWith(
            response,
            request,
            COOKIE_NAMES.ADMIN_REFRESH_TOKEN,
        );
    });

    it('wraps refresh errors in InternalServerErrorException', async () => {
        authService.refreshAccessToken.mockRejectedValue(new Error('fail'));

        await expect(service.refreshAdminToken(response, request)).rejects.toBeInstanceOf(
            InternalServerErrorException,
        );
    });

    it('returns current admin identity via AuthService', () => {
        const result = service.getMe(request);

        expect(result).toEqual({ id: 'admin' });
        expect(authService.getMe).toHaveBeenCalledWith(request, UserRoles.ADMIN);
    });
});
