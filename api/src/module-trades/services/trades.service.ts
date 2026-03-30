import { Injectable } from '@nestjs/common';
import { TradesRepositoryService } from '@/module-trades/services/trades-repository.service';
import {
    ClosedPnlStatistics,
    ClosedPnlTimelinePoint,
    ClosedPnlTradePage,
} from '@/module-trades/types/trades.repository.types';
/*import {
    ClosedPnlTradePage,
    ClosedPnlStatistics,
    ClosedPnlTimelinePoint,
    ClosedPnlTradeSummary,
} from '@/module-trades/types';*/

@Injectable()
export class TradesService {
    constructor(private readonly tradesRepositoryService: TradesRepositoryService) {}

    async getClosedPnlStatistics(tradingAccountId: string): Promise<ClosedPnlStatistics> {
        const statistics =
            await this.tradesRepositoryService.findClosedPnlStatisticsByTradingAccountId(
                tradingAccountId,
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

    async getClosedPnlTimeline(tradingAccountId: string): Promise<ClosedPnlTimelinePoint[]> {
        const timeline =
            await this.tradesRepositoryService.findClosedPnlTimelineByTradingAccountId(
                tradingAccountId,
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
    ): Promise<ClosedPnlTradePage> {
        const totalItems =
            await this.tradesRepositoryService.countClosedTradesByTradingAccountId(
                tradingAccountId,
            );
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        const normalizedPage = Math.min(Math.max(1, page), totalPages);
        const trades = await this.tradesRepositoryService.findRecentClosedTradesByTradingAccountId(
            tradingAccountId,
            normalizedPage,
            pageSize,
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
}
