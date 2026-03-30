import { Injectable } from '@nestjs/common';
import { TradesRepositoryService } from '@/module-trades/services/trades-repository.service';
import {
    DEFAULT_ANALYTICS_PERIOD,
    type AnalyticsPeriod,
} from '@/module-analyze/constants/analytics-periods';
import {
    ClosedPnlStatistics,
    ClosedPnlTimelinePoint,
    ClosedPnlTradePage,
} from '@/module-analyze/types/analyse.types';

@Injectable()
export class AnalyseService {
    constructor(private readonly tradesRepositoryService: TradesRepositoryService) {}

    async getClosedPnlStatistics(
        tradingAccountId: string,
        period: AnalyticsPeriod = DEFAULT_ANALYTICS_PERIOD,
    ): Promise<ClosedPnlStatistics> {
        const fromTimestamp = this.resolvePeriodStart(period);
        const statistics =
            await this.tradesRepositoryService.findClosedPnlStatisticsByTradingAccountId(
                tradingAccountId,
                fromTimestamp,
            );
        const totalTrades = this.toNumber(statistics.totalTrades);
        const winningTrades = this.toNumber(statistics.winningTrades);
        const losingTrades = this.toNumber(statistics.losingTrades);
        const totalClosedPnl = this.toNumber(statistics.totalClosedPnl);
        const grossProfit = this.toNumber(statistics.grossProfit);
        const grossLoss = this.toNumber(statistics.grossLoss);
        const averageClosedPnl = this.toNumber(statistics.averageClosedPnl);
        const bestTrade = this.toNullableNumber(statistics.bestTrade);
        const worstTrade = this.toNullableNumber(statistics.worstTrade);
        const absoluteGrossLoss = Math.abs(grossLoss);

        return {
            totalTrades,
            winningTrades,
            losingTrades,
            winRate: totalTrades ? (winningTrades / totalTrades) * 100 : 0,
            totalClosedPnl,
            grossProfit,
            grossLoss,
            averageClosedPnl,
            bestTrade,
            worstTrade,
            profitFactor: absoluteGrossLoss ? grossProfit / absoluteGrossLoss : null,
            latestTradeAt: this.toIsoDate(statistics.latestTradeAt),
        };
    }

    async getClosedPnlTimeline(
        tradingAccountId: string,
        period: AnalyticsPeriod = DEFAULT_ANALYTICS_PERIOD,
    ): Promise<ClosedPnlTimelinePoint[]> {
        const fromTimestamp = this.resolvePeriodStart(period);
        const timeline = await this.tradesRepositoryService.findClosedPnlTimelineByTradingAccountId(
            tradingAccountId,
            fromTimestamp,
        );
        let cumulativeClosedPnl = 0;

        return timeline.flatMap(point => {
            const time = this.toIsoDate(point.createdTime);

            if (!time) {
                return [];
            }

            cumulativeClosedPnl += this.toNumber(point.closedPnl);

            return {
                time,
                cumulativeClosedPnl,
            };
        });
    }

    async getClosedTradePage(
        tradingAccountId: string,
        page: number,
        pageSize: number,
        period: AnalyticsPeriod = DEFAULT_ANALYTICS_PERIOD,
    ): Promise<ClosedPnlTradePage> {
        const fromTimestamp = this.resolvePeriodStart(period);
        const totalItems = await this.tradesRepositoryService.countClosedTradesByTradingAccountId(
            tradingAccountId,
            fromTimestamp,
        );
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        const normalizedPage = Math.min(Math.max(1, page), totalPages);
        const trades = await this.tradesRepositoryService.findRecentClosedTradesByTradingAccountId(
            tradingAccountId,
            normalizedPage,
            pageSize,
            fromTimestamp,
        );

        return {
            items: trades.map(trade => ({
                id: trade.id,
                symbol: trade.symbol,
                side: trade.side,
                closedPnl: this.toNumber(trade.closedPnl),
                qty: this.toNumber(trade.qty),
                avgEntryPrice: this.toNumber(trade.avgEntryPrice),
                avgExitPrice: this.toNumber(trade.avgExitPrice),
                leverage: trade.leverage,
                createdTime: this.toIsoDate(trade.createdTime),
                updatedTime: this.toIsoDate(trade.updatedTime),
                orderType: trade.orderType,
            })),
            page: normalizedPage,
            pageSize,
            totalItems,
            totalPages,
        };
    }

    private toNumber(value: string | null | undefined): number {
        return value ? Number(value) : 0;
    }

    private toNullableNumber(value: string | null | undefined): number | null {
        return value === null || value === undefined ? null : Number(value);
    }

    private toIsoDate(value: string | null | undefined): string | null {
        if (!value) {
            return null;
        }

        return new Date(Number(value)).toISOString();
    }

    private resolvePeriodStart(period: AnalyticsPeriod): string | null {
        if (period === 'all') {
            return null;
        }

        const daysByPeriod: Record<Exclude<AnalyticsPeriod, 'all'>, number> = {
            '7d': 7,
            '30d': 30,
            '90d': 90,
            '180d': 180,
        };

        return String(Date.now() - daysByPeriod[period] * 24 * 60 * 60 * 1000);
    }
}
