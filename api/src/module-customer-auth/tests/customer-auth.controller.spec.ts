import type { Request, Response } from 'express';
import { CustomerAuthController } from '@/module-customer-auth/customer-auth.controller';
import { CustomerAuthService } from '@/module-customer-auth/services/customer-auth.service';

describe('CustomerAuthController', () => {
    let controller: CustomerAuthController;
    let service: jest.Mocked<CustomerAuthService>;

    beforeEach(() => {
        service = {
            register: jest.fn(),
            login: jest.fn(),
            logout: jest.fn(),
            refreshCustomerToken: jest.fn(),
            getMe: jest.fn(),
        } as unknown as jest.Mocked<CustomerAuthService>;

        controller = new CustomerAuthController(service);
    });

    it('registers customer accounts', async () => {
        const dto = { email: 'john@example.com' } as any;
        await controller.register({} as Response, {} as Request, dto);

        expect(service.register).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), dto);
    });

    it('handles login/logout/refresh/me via the service', async () => {
        const req = {} as Request;
        const res = {} as Response;
        const dto = { login: 'john' } as any;

        await controller.login(res, req, dto);
        await controller.logout(res, req);
        await controller.refreshCustomerToken(res, req);
        controller.getMe(req);

        expect(service.login).toHaveBeenCalledWith(res, req, dto);
        expect(service.logout).toHaveBeenCalledWith(req, res);
        expect(service.refreshCustomerToken).toHaveBeenCalledWith(res, req);
        expect(service.getMe).toHaveBeenCalledWith(req);
    });
});
