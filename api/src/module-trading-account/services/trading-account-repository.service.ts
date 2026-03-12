import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { TradingAccount } from '@/module-trading-account/entities/trading-account.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TradingAccountRepositoryService {
    constructor(
        @InjectRepository(TradingAccount)
        private readonly tradingAccountRepository: Repository<TradingAccount>,
    ) {}

    async saveTradingAccount(tradingAccountData: Partial<TradingAccount>): Promise<TradingAccount> {
        return this.tradingAccountRepository.save(tradingAccountData);
    }

    async findTradingAccountsByUserId(id: string): Promise<TradingAccount[]> {
        return this.tradingAccountRepository.find({
            where: { userId: id },
            relations: {
                apiKey: true,
            },
            select: {
                id: true,
                tradingAccountName: true,
                exchange: true,
                market: true,
                apiKey: {
                    apiKeyName: true,
                },
            },
        });
    }
}
