import { DeleteResult, EntityManager, Repository, UpdateResult } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { TradingAccount } from '@/module-trading-account/entities/trading-account.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TradingAccountRepositoryService {
    constructor(
        @InjectRepository(TradingAccount)
        private readonly tradingAccountRepository: Repository<TradingAccount>,
    ) {}

    async saveTradingAccount(
        tradingAccountData: Partial<TradingAccount>,
        entityManager?: EntityManager,
    ): Promise<TradingAccount> {
        const repository = entityManager
            ? entityManager.getRepository(TradingAccount)
            : this.tradingAccountRepository;

        return repository.save(tradingAccountData);
    }

    async findTradingAccountsByUserId(id: string): Promise<TradingAccount[]> {
        return this.tradingAccountRepository.find({
            where: { userId: id },
            select: {
                id: true,
                tradingAccountName: true,
                exchange: true,
                market: true,
            },
        });
    }

    async findTradingAccountById(id: string): Promise<TradingAccount | null> {
        return this.tradingAccountRepository.findOne({
            where: { id },
            select: {
                id: true,
                userId: true,
                tradingAccountName: true,
                exchange: true,
                market: true,
                exchangeUserAccountId: true,
            },
        });
    }

    async updateTradingAccount(
        id: string,
        tradingAccountData: Partial<TradingAccount>,
        entityManager?: EntityManager,
    ): Promise<UpdateResult> {
        const repository = entityManager
            ? entityManager.getRepository(TradingAccount)
            : this.tradingAccountRepository;

        return repository.update(id, tradingAccountData);
    }

    async removeTradingAccount(id: string): Promise<DeleteResult> {
        return this.tradingAccountRepository.delete(id);
    }
}
