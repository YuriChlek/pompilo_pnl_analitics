import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository, UpdateResult } from 'typeorm';
import { TradingAccountBinding } from '@/module-trading-account/entities/trading-account-binding.entity';

@Injectable()
export class TradingAccountBindingRepositoryService {
    constructor(
        @InjectRepository(TradingAccountBinding)
        private readonly tradingAccountBindingRepository: Repository<TradingAccountBinding>,
    ) {}

    async saveTradingAccountBinding(
        tradingAccountBindingData: Partial<TradingAccountBinding>,
        entityManager?: EntityManager,
    ): Promise<TradingAccountBinding> {
        const repository = entityManager
            ? entityManager.getRepository(TradingAccountBinding)
            : this.tradingAccountBindingRepository;

        return repository.save(tradingAccountBindingData);
    }

    async findTradingAccountBindingsByTradingAccountIds(
        tradingAccountIds: string[],
    ): Promise<TradingAccountBinding[]> {
        if (tradingAccountIds.length === 0) {
            return [];
        }

        return this.tradingAccountBindingRepository.find({
            where: {
                tradingAccountId: In(tradingAccountIds),
            },
            relations: {
                apiKey: true,
            },
            select: {
                id: true,
                tradingAccountId: true,
                apiKey: {
                    id: true,
                    apiKeyName: true,
                },
            },
        });
    }

    async findTradingAccountBindingByTradingAccountId(
        tradingAccountId: string,
    ): Promise<TradingAccountBinding | null> {
        return this.tradingAccountBindingRepository.findOne({
            where: { tradingAccountId },
            relations: {
                apiKey: true,
            },
            select: {
                id: true,
                tradingAccountId: true,
                apiKeyId: true,
                apiKey: {
                    id: true,
                    apiKeyName: true,
                },
            },
        });
    }

    async findTradingAccountBindingByApiKeyId(
        apiKeyId: string,
    ): Promise<TradingAccountBinding | null> {
        return this.tradingAccountBindingRepository.findOne({
            where: { apiKeyId },
            select: {
                id: true,
                tradingAccountId: true,
                apiKeyId: true,
            },
        });
    }

    async updateTradingAccountBindingApiKey(
        tradingAccountId: string,
        apiKeyId: string,
        entityManager?: EntityManager,
    ): Promise<UpdateResult> {
        const repository = entityManager
            ? entityManager.getRepository(TradingAccountBinding)
            : this.tradingAccountBindingRepository;

        return repository.update({ tradingAccountId }, { apiKeyId });
    }
}
