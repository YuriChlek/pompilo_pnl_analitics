import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    Req,
    ValidationPipe,
} from '@nestjs/common';
import { TradingAccountService } from '@/module-trading-account/services/trading-account.service';
import { TradingAccountQueryService } from '@/module-trading-account/services/trading-account-query.service';
import { TradingAccountAnalyticsQueryDto } from '@/module-trading-account/dto/trading-account-analytics-query.dto';
import { CreateTradingAccountDto } from '@/module-trading-account/dto/create-trading-account.dto';
import { UpdateTradingAccountDto } from '@/module-trading-account/dto/update-trading-account.dto';
import { TradingAccountTradesQueryDto } from '@/module-trading-account/dto/trading-account-trades-query.dto';
import { Authorisation } from '@/module-auth/decorators/auth.decorator';
import { USER_ROLES } from '@/module-auth/enums/auth-enums';
import type { Request } from 'express';

@Controller()
export class TradingAccountController {
    constructor(
        private readonly tradingAccountService: TradingAccountService,
        private readonly tradingAccountQueryService: TradingAccountQueryService,
    ) {}

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

    @Get(':id')
    @Authorisation(USER_ROLES.CUSTOMER)
    findOne(
        @Req() request: Request,
        @Param('id') id: string,
        @Query(new ValidationPipe({ transform: true })) query: TradingAccountAnalyticsQueryDto,
    ) {
        return this.tradingAccountQueryService.findOne(request, id, query.period);
    }

    @Get(':id/trades')
    @Authorisation(USER_ROLES.CUSTOMER)
    findTrades(
        @Req() request: Request,
        @Param('id') id: string,
        @Query(new ValidationPipe({ transform: true })) query: TradingAccountTradesQueryDto,
    ) {
        return this.tradingAccountQueryService.findTrades(request, id, query);
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
