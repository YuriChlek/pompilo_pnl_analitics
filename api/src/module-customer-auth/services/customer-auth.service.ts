import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AuthService } from '@/module-auth/services/auth.service';
import type { Request, Response } from 'express';
import { COOKIE_NAMES } from '@/module-auth/constants/auth.constants';
import { LoginCustomerDto } from '@/module-customer-auth/dto/login-customer.dto';
import { UserPayload } from '@/module-user/interfaces/user.interface';
import { RegisterCustomerDto } from '@/module-customer-auth/dto/register-customer.dto';
import { UserRoles } from '@/module-auth/enums/role.enum';

@Injectable()
export class CustomerAuthService {
    public constructor(private readonly authService: AuthService) {}

    async register(
        response: Response,
        request: Request,
        registerCustomerDto: RegisterCustomerDto,
    ): Promise<UserPayload> {
        return this.authService.register(response, request, registerCustomerDto);
    }

    async login(
        response: Response,
        request: Request,
        loginCustomerDto: LoginCustomerDto,
    ): Promise<UserPayload> {
        return this.authService.login(response, request, loginCustomerDto);
    }

    async logout(request: Request, response: Response): Promise<void> {
        await this.authService.logout(request, response, UserRoles.CUSTOMER);
    }

    async refreshCustomerToken(response: Response, request: Request) {
        try {
            return await this.authService.refreshAccessToken(
                response,
                request,
                COOKIE_NAMES.CUSTOMER_REFRESH_TOKEN,
            );
        } catch (error) {
            if (error instanceof Error) {
                throw new InternalServerErrorException(error.message);
            }

            throw new InternalServerErrorException('An unexpected error occurred');
        }
    }

    getMe(request: Request): UserPayload | null {
        return this.authService.getMe(request, UserRoles.CUSTOMER);
    }
}
