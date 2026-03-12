import type { Request, Response } from 'express';
import { AdminAuthController } from '@/module-admin-auth/admin-auth.controller';
import { AdminAuthService } from '@/module-admin-auth/services/admin-auth.service';

describe('AdminAuthController', () => {
    let controller: AdminAuthController;
    let service: jest.Mocked<AdminAuthService>;

    beforeEach(() => {
        service = {
            login: jest.fn(),
            logout: jest.fn(),
            refreshAdminToken: jest.fn(),
            getMe: jest.fn(),
        } as unknown as jest.Mocked<AdminAuthService>;

        controller = new AdminAuthController(service);
    });

    it('delegates login to the admin auth service', async () => {
        const req = {} as Request;
        const res = {} as Response;
        const dto = { login: 'admin' } as any;

        await controller.login(res, req, dto);

        expect(service.login).toHaveBeenCalledWith(res, req, dto);
    });

    it('exposes logout/refresh/me endpoints', async () => {
        const req = {} as Request;
        const res = {} as Response;

        await controller.logout(res, req);
        await controller.refreshAdminToken(res, req);
        controller.getMe(req);

        expect(service.logout).toHaveBeenCalledWith(req, res);
        expect(service.refreshAdminToken).toHaveBeenCalledWith(res, req);
        expect(service.getMe).toHaveBeenCalledWith(req);
    });
});
