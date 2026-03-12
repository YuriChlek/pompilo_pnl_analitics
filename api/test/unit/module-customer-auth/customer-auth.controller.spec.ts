import type { Request, Response } from 'express';
import { CustomerAuthController } from '@/module-customer-auth/customer-auth.controller';
import { CustomerAuthService } from '@/module-customer-auth/services/customer-auth.service';
import { UserRoles } from '@/module-auth/enums/role.enum';

describe('CustomerAuthController', () => {
    let controller: CustomerAuthController;
    let service: jest.Mocked<CustomerAuthService>;
    let registerMock: jest.MockedFunction<CustomerAuthService['register']>;
    let loginMock: jest.MockedFunction<CustomerAuthService['login']>;
    let logoutMock: jest.MockedFunction<CustomerAuthService['logout']>;
    let refreshMock: jest.MockedFunction<CustomerAuthService['refreshCustomerToken']>;
    let getMeMock: jest.MockedFunction<CustomerAuthService['getMe']>;

    beforeEach(() => {
        registerMock = jest.fn();
        loginMock = jest.fn();
        logoutMock = jest.fn();
        refreshMock = jest.fn();
        getMeMock = jest.fn();
        service = {
            register: registerMock,
            login: loginMock,
            logout: logoutMock,
            refreshCustomerToken: refreshMock,
            getMe: getMeMock,
        } as jest.Mocked<CustomerAuthService>;

        controller = new CustomerAuthController(service);
    });

    it('registers customer accounts', async () => {
        const dto: Parameters<CustomerAuthController['register']>[2] = {
            email: 'john@example.com',
            password: 'Secret123',
            name: 'John',
        };
        await controller.register({} as Response, {} as Request, dto);

        expect(registerMock).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), dto);
    });

    it('handles login/logout/refresh/me via the service', async () => {
        const req = {} as Request;
        const res = {} as Response;
        const dto: Parameters<CustomerAuthController['login']>[2] = {
            login: 'john',
            password: 'Secret123',
            role: UserRoles.CUSTOMER,
        };

        await controller.login(res, req, dto);
        await controller.logout(res, req);
        await controller.refreshCustomerToken(res, req);
        controller.getMe(req);

        expect(loginMock).toHaveBeenCalledWith(res, req, dto);
        expect(logoutMock).toHaveBeenCalledWith(req, res);
        expect(refreshMock).toHaveBeenCalledWith(res, req);
        expect(getMeMock).toHaveBeenCalledWith(req);
    });
});
