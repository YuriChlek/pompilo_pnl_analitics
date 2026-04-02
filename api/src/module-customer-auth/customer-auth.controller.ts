import { Controller, Post, Body, Res, Req } from '@nestjs/common';
import { CustomerAuthService } from './services/customer-auth.service';
import type { Request, Response } from 'express';
import { UserPayload } from '@/module-user/interfaces/user.interfaces';
import { LoginCustomerDto } from '@/module-customer-auth/dto/login-customer.dto';
import { RegisterCustomerDto } from '@/module-customer-auth/dto/register-customer.dto';

@Controller()
export class CustomerAuthController {
    constructor(private readonly customerService: CustomerAuthService) {}

    @Post('register')
    register(
        @Res({ passthrough: true }) response: Response,
        @Req() request: Request,
        @Body() registerCustomerDto: RegisterCustomerDto,
    ): Promise<UserPayload> {
        return this.customerService.register(response, request, registerCustomerDto);
    }

    @Post('login')
    login(
        @Res({ passthrough: true }) response: Response,
        @Req() request: Request,
        @Body() loginCustomerDto: LoginCustomerDto,
    ): Promise<UserPayload> {
        return this.customerService.login(response, request, loginCustomerDto);
    }

    @Post('logout')
    logout(@Res({ passthrough: true }) response: Response, @Req() request: Request) {
        return this.customerService.logout(request, response);
    }

    @Post('refresh')
    refreshCustomerToken(@Res({ passthrough: true }) response: Response, @Req() request: Request) {
        return this.customerService.refreshCustomerToken(response, request);
    }

    @Post('me')
    getMe(@Req() request: Request) {
        return this.customerService.getMe(request);
    }
}
