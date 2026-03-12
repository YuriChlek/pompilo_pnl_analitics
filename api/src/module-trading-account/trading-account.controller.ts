import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { TradingAccountService } from './services/trading-account.service';
import { CreateTradingAccountDto } from './dto/create-trading-account.dto';
import { UpdateTradingAccountDto } from './dto/update-trading-account.dto';
import { Authorisation } from '@/module-auth/decorators/auth.decorator';
import { UserRoles } from '@/module-auth/enums/role.enum';
import type { Request } from 'express';

@Controller()
export class TradingAccountController {
    constructor(private readonly tradingAccountService: TradingAccountService) {}

    @Post('create')
    @Authorisation(UserRoles.CUSTOMER)
    create(@Body() createTradingAccountDto: CreateTradingAccountDto) {
        return this.tradingAccountService.create(createTradingAccountDto);
    }

    @Get()
    @Authorisation(UserRoles.CUSTOMER)
    findAll(@Req() request: Request) {
        return this.tradingAccountService.findAll(request);
    }

    @Patch(':id')
    @Authorisation(UserRoles.CUSTOMER)
    update(@Param('id') id: string, @Body() updateTradingAccountDto: UpdateTradingAccountDto) {
        return this.tradingAccountService.update(+id, updateTradingAccountDto);
    }

    @Delete('remove/:id')
    @Authorisation(UserRoles.CUSTOMER)
    remove(@Param('id') id: string) {
        return this.tradingAccountService.remove(+id);
    }
}
