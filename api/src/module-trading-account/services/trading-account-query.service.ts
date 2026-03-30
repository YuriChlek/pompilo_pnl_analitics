import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '@/module-auth-token/services/token.service';
import { getUserIdFromToken } from '@/common/utils/get-user-id-from-tocken';
import { TradingAccountRepositoryService } from '@/module-trading-account/services/trading-account-repository.service';
import { TradingAccountBindingRepositoryService } from '@/module-trading-account/services/trading-account-binding.repository.service';
import { TradesService } from '@/module-trades/services/trades.service';
import type { Request } from 'express';
import {
    TradingAccountApiKeySummary,
    TradingAccountPageData,
    TradingAccountSummary,
} from '@/module-trading-account/types';
import { TradingAccount } from '@/module-trading-account/entities/trading-account.entity';
import { ApiKey } from '@/module-api-keys/entities/api-key.entity';
import { TradingAccountTradesQueryDto } from '@/module-trading-account/dto/trading-account-trades-query.dto';
import { ClosedPnlTradePage } from '@/module-trades/types/trades.repository.types';
import { type AnalyticsPeriod } from '@/module-trades/constants/analytics-periods';

@Injectable()
export class TradingAccountQueryService {
    constructor(
        private readonly tokenService: TokenService,
        private readonly tradingAccountRepositoryService: TradingAccountRepositoryService,
        private readonly tradingAccountBindingRepositoryService: TradingAccountBindingRepositoryService,
        private readonly tradesService: TradesService,
    ) {}

    async findOne(
        request: Request,
        tradingAccountId: string,
        period: AnalyticsPeriod,
    ): Promise<TradingAccountPageData> {
        const userId = this.getAuthorizedUserId(request);
        const tradingAccount = await this.getOwnedTradingAccount(tradingAccountId, userId);
        const tradingAccountBinding =
            await this.tradingAccountBindingRepositoryService.findTradingAccountBindingByTradingAccountId(
                tradingAccountId,
            );

        const [statistics, chart] = await Promise.all([
            this.tradesService.getClosedPnlStatistics(tradingAccountId, period),
            this.tradesService.getClosedPnlTimeline(tradingAccountId, period),
        ]);

        return {
            account: this.buildTradingAccountSummary(
                tradingAccount,
                this.toApiKeySummary(tradingAccountBinding?.apiKey),
            ),
            statistics,
            chart,
        };
    }

    async findTrades(
        request: Request,
        tradingAccountId: string,
        query: TradingAccountTradesQueryDto,
    ): Promise<ClosedPnlTradePage> {
        const userId = this.getAuthorizedUserId(request);

        await this.getOwnedTradingAccount(tradingAccountId, userId);

        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 10;

        return this.tradesService.getClosedTradePage(
            tradingAccountId,
            page,
            pageSize,
            query.period,
        );
    }

    private getAuthorizedUserId(request: Request): string {
        const userId = getUserIdFromToken(request, this.tokenService);

        if (!userId) {
            throw new UnauthorizedException('Invalid or missing user.');
        }

        return userId;
    }

    private async getOwnedTradingAccount(
        tradingAccountId: string,
        userId: string,
    ): Promise<TradingAccount> {
        const tradingAccount =
            await this.tradingAccountRepositoryService.findTradingAccountById(tradingAccountId);

        if (!tradingAccount) {
            throw new NotFoundException('Trading account not found.');
        }

        if (tradingAccount.userId !== userId) {
            throw new UnauthorizedException('Invalid or missing user.');
        }

        return tradingAccount;
    }

    private buildTradingAccountSummary(
        tradingAccount: Pick<TradingAccount, 'id' | 'tradingAccountName' | 'exchange' | 'market'>,
        apiKey: TradingAccountApiKeySummary | null,
    ): TradingAccountSummary {
        return {
            id: tradingAccount.id,
            tradingAccountName: tradingAccount.tradingAccountName,
            exchange: tradingAccount.exchange,
            market: tradingAccount.market,
            apiKeyId: apiKey?.id ?? null,
            apiKey: apiKey
                ? {
                      apiKeyName: apiKey.apiKeyName,
                  }
                : null,
        };
    }

    private toApiKeySummary(
        apiKey: Pick<ApiKey, 'id' | 'apiKeyName'> | null | undefined,
    ): TradingAccountApiKeySummary | null {
        if (!apiKey) {
            return null;
        }

        return {
            id: apiKey.id,
            apiKeyName: apiKey.apiKeyName,
        };
    }
}
