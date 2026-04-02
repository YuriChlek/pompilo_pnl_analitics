import { Injectable } from '@nestjs/common';
import { TradingAccountBindingRepositoryService } from '@/module-trading-account/services/trading-account-binding.repository.service';
import { AnalyzeService } from '@/module-analyze/services/analyze.service';
import type { Request } from 'express';
import { TradingAccountPageData } from '@/module-trading-account/types/trading-account.types';
import { TradingAccountTradesQueryDto } from '@/module-trading-account/dto/trading-account-trades-query.dto';
import { ClosedPnlTradePage } from '@/module-analyze/types/analyze.types';
import type { AnalyticsPeriod } from '@/module-analyze/types/analytics-period.types';
import { TradingAccountAccessService } from '@/module-trading-account/services/trading-account-access.service';
import { TradingAccountViewService } from '@/module-trading-account/services/trading-account-view.service';

@Injectable()
export class TradingAccountQueryService {
    constructor(
        private readonly tradingAccountBindingRepositoryService: TradingAccountBindingRepositoryService,
        private readonly analyzeService: AnalyzeService,
        private readonly tradingAccountAccessService: TradingAccountAccessService,
        private readonly tradingAccountViewService: TradingAccountViewService,
    ) {}

    async findOne(
        request: Request,
        tradingAccountId: string,
        period: AnalyticsPeriod,
    ): Promise<TradingAccountPageData> {
        const userId = this.tradingAccountAccessService.getAuthorizedUserId(request);
        const tradingAccount = await this.tradingAccountAccessService.getOwnedTradingAccount(
            tradingAccountId,
            userId,
        );
        const tradingAccountBinding =
            await this.tradingAccountBindingRepositoryService.findTradingAccountBindingByTradingAccountId(
                tradingAccountId,
            );

        const [statistics, chart] = await Promise.all([
            this.analyzeService.getClosedPnlStatistics(tradingAccountId, period),
            this.analyzeService.getClosedPnlTimeline(tradingAccountId, period),
        ]);

        return {
            account: this.tradingAccountViewService.buildTradingAccountSummary(
                tradingAccount,
                this.tradingAccountViewService.toApiKeySummary(tradingAccountBinding?.apiKey),
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
        const userId = this.tradingAccountAccessService.getAuthorizedUserId(request);

        await this.tradingAccountAccessService.getOwnedTradingAccount(tradingAccountId, userId);

        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 10;

        return this.analyzeService.getClosedTradePage(
            tradingAccountId,
            page,
            pageSize,
            query.period,
        );
    }
}
