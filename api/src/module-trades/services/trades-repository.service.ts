import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { FuturesClosedPnl } from '@/module-trades/entities/futures-closed-pnl.entity';

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
}
