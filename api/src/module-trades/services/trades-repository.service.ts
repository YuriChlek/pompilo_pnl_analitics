import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FuturesClosedPnl } from '@/module-trades/entities/futures-closed-pnl.entity';

@Injectable()
export class TradesRepositoryService {
    constructor(
        @InjectRepository(FuturesClosedPnl)
        private readonly futuresClosedPnlRepository: Repository<FuturesClosedPnl>,
    ) {}

    async saveClosedPnl(closedPnl: FuturesClosedPnl[]) {
        return this.futuresClosedPnlRepository
            .createQueryBuilder()
            .insert()
            .into(FuturesClosedPnl)
            .values(closedPnl)
            .orIgnore()
            .execute();
    }
}
