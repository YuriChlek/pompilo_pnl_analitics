import type { Request, Response } from 'express';
import { AdminAuthController } from '@/module-admin-auth/admin-auth.controller';
import { AdminAuthService } from '@/module-admin-auth/services/admin-auth.service';
import { LoginAdminDto } from '@/module-admin-auth/dto/login-admin.dto';
import { USER_ROLES } from '@/module-auth/enums/auth-enums';

describe('AdminAuthController', () => {
    let controller: AdminAuthController;
    let service: jest.Mocked<AdminAuthService>;
    let loginMock: jest.MockedFunction<AdminAuthService['login']>;
    let logoutMock: jest.MockedFunction<AdminAuthService['logout']>;
    let refreshMock: jest.MockedFunction<AdminAuthService['refreshAdminToken']>;
    let getMeMock: jest.MockedFunction<AdminAuthService['getMe']>;

    beforeEach(() => {
        loginMock = jest.fn();
        logoutMock = jest.fn();
        refreshMock = jest.fn();
        getMeMock = jest.fn();
        service = {
            login: loginMock,
            logout: logoutMock,
            refreshAdminToken: refreshMock,
            getMe: getMeMock,
        } as jest.Mocked<AdminAuthService>;
        controller = new AdminAuthController(service);
    });

    it('delegates login to the admin auth service', async () => {
        const req = {} as Request;
        const res = {} as Response;
        const dto: LoginAdminDto = {
            login: 'admin@example.com',
            password: 'Password1',
            role: USER_ROLES.ADMIN,
        };

        await controller.login(res, req, dto);

        expect(loginMock).toHaveBeenCalledWith(res, req, dto);
    });

    it('exposes logout/refresh/me endpoints', async () => {
        const req = {} as Request;
        const res = {} as Response;

        await controller.logout(res, req);
        await controller.refreshAdminToken(res, req);
        controller.getMe(req);

        expect(logoutMock).toHaveBeenCalledWith(req, res);
        expect(refreshMock).toHaveBeenCalledWith(res, req);
        expect(getMeMock).toHaveBeenCalledWith(req);
    });
});
