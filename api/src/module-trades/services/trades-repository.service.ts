import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { FuturesClosedPnl } from '@/module-trades/entities/futures-closed-pnl.entity';
import { ClosedPnlStatisticsRaw } from '@/module-trades/types/trades.repository.types';

@Injectable()
export class TradesRepositoryService {
    constructor(
        @InjectRepository(FuturesClosedPnl)
        private readonly futuresClosedPnlRepository: Repository<FuturesClosedPnl>,
    ) {}

    async saveClosedPnl(closedPnl: FuturesClosedPnl[]) {
        if (!closedPnl.length) {
            return null;
        }

        const existingOrderIds = await this.findExistingOrderIds(
            closedPnl[0].tradingAccountId,
            closedPnl.map(({ orderId }) => orderId),
        );
        const newClosedPnl = closedPnl.filter(({ orderId }) => !existingOrderIds.has(orderId));

        if (!newClosedPnl.length) {
            return null;
        }

        return this.futuresClosedPnlRepository
            .createQueryBuilder()
            .insert()
            .into(FuturesClosedPnl)
            .values(newClosedPnl)
            .execute();
    }

    async findLatestUpdatedTime(tradingAccountId: string): Promise<string | null> {
        const latestTrade = await this.futuresClosedPnlRepository.findOne({
            where: { tradingAccountId },
            order: { updatedTime: 'DESC' },
            select: { updatedTime: true },
        });

        return latestTrade?.updatedTime ?? null;
    }

    async findClosedPnlStatisticsByTradingAccountId(
        tradingAccountId: string,
        fromTimestamp?: string | null,
    ): Promise<ClosedPnlStatisticsRaw> {
        const queryBuilder = this.futuresClosedPnlRepository
            .createQueryBuilder('trade')
            .select('COUNT(*)', 'totalTrades')
            .addSelect('SUM(CASE WHEN trade.closedPnl > 0 THEN 1 ELSE 0 END)', 'winningTrades')
            .addSelect('SUM(CASE WHEN trade.closedPnl < 0 THEN 1 ELSE 0 END)', 'losingTrades')
            .addSelect('COALESCE(SUM(trade.closedPnl), 0)', 'totalClosedPnl')
            .addSelect(
                'COALESCE(SUM(CASE WHEN trade.closedPnl > 0 THEN trade.closedPnl ELSE 0 END), 0)',
                'grossProfit',
            )
            .addSelect(
                'COALESCE(SUM(CASE WHEN trade.closedPnl < 0 THEN trade.closedPnl ELSE 0 END), 0)',
                'grossLoss',
            )
            .addSelect('COALESCE(AVG(trade.closedPnl), 0)', 'averageClosedPnl')
            .addSelect('MAX(trade.closedPnl)', 'bestTrade')
            .addSelect('MIN(trade.closedPnl)', 'worstTrade')
            .addSelect('MAX(trade.createdTime)', 'latestTradeAt')
            .where('trade.tradingAccountId = :tradingAccountId', { tradingAccountId });

        this.applyFromTimestampFilter(queryBuilder, fromTimestamp);

        const statistics = await queryBuilder.getRawOne<ClosedPnlStatisticsRaw>();

        return (
            statistics ?? {
                totalTrades: '0',
                winningTrades: '0',
                losingTrades: '0',
                totalClosedPnl: '0',
                grossProfit: '0',
                grossLoss: '0',
                averageClosedPnl: '0',
                bestTrade: null,
                worstTrade: null,
                latestTradeAt: null,
            }
        );
    }

    async findClosedPnlTimelineByTradingAccountId(
        tradingAccountId: string,
        fromTimestamp?: string | null,
    ): Promise<Array<Pick<FuturesClosedPnl, 'createdTime' | 'closedPnl'>>> {
        const queryBuilder = this.futuresClosedPnlRepository
            .createQueryBuilder('trade')
            .select(['trade.createdTime AS "createdTime"', 'trade.closedPnl AS "closedPnl"'])
            .where('trade.tradingAccountId = :tradingAccountId', { tradingAccountId })
            .orderBy('trade.createdTime', 'ASC');

        this.applyFromTimestampFilter(queryBuilder, fromTimestamp);

        return queryBuilder.getRawMany<Pick<FuturesClosedPnl, 'createdTime' | 'closedPnl'>>();
    }

    async findRecentClosedTradesByTradingAccountId(
        tradingAccountId: string,
        page: number,
        pageSize: number,
        fromTimestamp?: string | null,
    ): Promise<FuturesClosedPnl[]> {
        const queryBuilder = this.futuresClosedPnlRepository
            .createQueryBuilder('trade')
            .select([
                'trade.id',
                'trade.symbol',
                'trade.side',
                'trade.closedPnl',
                'trade.qty',
                'trade.avgEntryPrice',
                'trade.avgExitPrice',
                'trade.leverage',
                'trade.createdTime',
                'trade.updatedTime',
                'trade.orderType',
            ])
            .where('trade.tradingAccountId = :tradingAccountId', { tradingAccountId })
            .orderBy('trade.createdTime', 'DESC')
            .skip((page - 1) * pageSize)
            .take(pageSize);

        this.applyFromTimestampFilter(queryBuilder, fromTimestamp);

        return queryBuilder.getMany();
    }

    async countClosedTradesByTradingAccountId(
        tradingAccountId: string,
        fromTimestamp?: string | null,
    ): Promise<number> {
        const queryBuilder = this.futuresClosedPnlRepository
            .createQueryBuilder('trade')
            .where('trade.tradingAccountId = :tradingAccountId', { tradingAccountId });

        this.applyFromTimestampFilter(queryBuilder, fromTimestamp);

        return queryBuilder.getCount();
    }

    private async findExistingOrderIds(
        tradingAccountId: string,
        orderIds: string[],
    ): Promise<Set<string>> {
        const existingTrades = await this.futuresClosedPnlRepository.find({
            where: {
                tradingAccountId,
                orderId: In(orderIds),
            },
            select: {
                orderId: true,
            },
        });

        return new Set(existingTrades.map(({ orderId }) => orderId));
    }

    private applyFromTimestampFilter(
        queryBuilder: SelectQueryBuilder<FuturesClosedPnl>,
        fromTimestamp?: string | null,
    ): void {
        if (!fromTimestamp) {
            return;
        }

        queryBuilder.andWhere('trade.createdTime >= :fromTimestamp', { fromTimestamp });
    }
}
