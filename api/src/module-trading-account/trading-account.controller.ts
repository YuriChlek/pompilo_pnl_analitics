import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { TradingAccountService } from './services/trading-account.service';
import { CreateTradingAccountDto } from './dto/create-trading-account.dto';
import { UpdateTradingAccountDto } from './dto/update-trading-account.dto';
import { Authorisation } from '@/module-auth/decorators/auth.decorator';
import { USER_ROLES } from '@/module-auth/enums/auth-enums';
import type { Request } from 'express';

@Controller()
export class TradingAccountController {
    constructor(private readonly tradingAccountService: TradingAccountService) {}

    @Post('create')
    @Authorisation(USER_ROLES.CUSTOMER)
    create(@Req() request: Request, @Body() createTradingAccountDto: CreateTradingAccountDto) {
        return this.tradingAccountService.create(request, createTradingAccountDto);
    }

    @Get()
    @Authorisation(USER_ROLES.CUSTOMER)
    findAll(@Req() request: Request) {
        return this.tradingAccountService.findAll(request);
    }

    @Patch('update/:id')
    @Authorisation(USER_ROLES.CUSTOMER)
    update(
        @Req() request: Request,
        @Param('id') id: string,
        @Body() updateTradingAccountDto: UpdateTradingAccountDto,
    ) {
        return this.tradingAccountService.update(request, id, updateTradingAccountDto);
    }

    @Delete('remove/:id')
    @Authorisation(USER_ROLES.CUSTOMER)
    remove(@Req() request: Request, @Param('id') id: string) {
        return this.tradingAccountService.remove(request, id);
    }
}
