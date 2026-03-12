import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CustomerAuthService } from '@/module-customer-auth/services/customer-auth.service';
import { AuthService } from '@/module-auth/services/auth.service';
import { COOKIE_NAMES } from '@/module-auth/constants/auth.constants';
import { UserRoles } from '@/module-auth/enums/role.enum';

type AwaitedReturn<T> = T extends Promise<infer R> ? R : T;

describe('CustomerAuthService', () => {
    let service: CustomerAuthService;
    let authService: {
        register: jest.MockedFunction<AuthService['register']>;
        login: jest.MockedFunction<AuthService['login']>;
        logout: jest.MockedFunction<AuthService['logout']>;
        refreshAccessToken: jest.MockedFunction<AuthService['refreshAccessToken']>;
        getMe: jest.MockedFunction<AuthService['getMe']>;
    };

    const request = {} as Request;
    const response = {} as Response;

    beforeEach(() => {
        authService = {
            register: jest
                .fn()
                .mockResolvedValue({ id: '1' } as AwaitedReturn<
                    ReturnType<AuthService['register']>
                >),
            login: jest
                .fn()
                .mockResolvedValue({ id: '1' } as AwaitedReturn<ReturnType<AuthService['login']>>),
            logout: jest.fn(),
            refreshAccessToken: jest.fn().mockResolvedValue(true),
            getMe: jest.fn().mockReturnValue({ id: '1' }),
        };

        service = new CustomerAuthService(authService as unknown as AuthService);
    });

    it('registers customers through AuthService', async () => {
        const dto: Parameters<CustomerAuthService['register']>[2] = {
            email: 'john@example.com',
            password: 'Secret123',
            name: 'John',
        };

        await service.register(response, request, dto);

        expect(authService.register).toHaveBeenCalledWith(response, request, dto);
    });

    it('logs customer in via AuthService', async () => {
        const dto: Parameters<CustomerAuthService['login']>[2] = {
            login: 'john',
            password: 'Secret123',
            role: UserRoles.CUSTOMER,
        };

        await service.login(response, request, dto);

        expect(authService.login).toHaveBeenCalledWith(response, request, dto);
    });

    it('logs customer out with customer role', async () => {
        await service.logout(request, response);

        expect(authService.logout).toHaveBeenCalledWith(request, response, UserRoles.CUSTOMER);
    });

    it('refreshes customer token using the correct cookie name', async () => {
        const result = await service.refreshCustomerToken(response, request);

        expect(result).toBe(true);
        expect(authService.refreshAccessToken).toHaveBeenCalledWith(
            response,
            request,
            COOKIE_NAMES.CUSTOMER_REFRESH_TOKEN,
        );
    });

    it('wraps refresh errors into InternalServerErrorException', async () => {
        authService.refreshAccessToken.mockRejectedValue(new Error('failed'));

        await expect(service.refreshCustomerToken(response, request)).rejects.toBeInstanceOf(
            InternalServerErrorException,
        );
    });

    it('rethrows UnauthorizedException coming from AuthService', async () => {
        const unauthorized = new UnauthorizedException();
        authService.refreshAccessToken.mockRejectedValue(unauthorized);

        await expect(service.refreshCustomerToken(response, request)).rejects.toBe(unauthorized);
    });

    it('delegates getMe lookup to AuthService', () => {
        const result = service.getMe(request);

        expect(result).toEqual({ id: '1' });
        expect(authService.getMe).toHaveBeenCalledWith(request, UserRoles.CUSTOMER);
    });
});
