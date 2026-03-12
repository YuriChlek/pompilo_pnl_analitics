import {
    HttpException,
    Injectable,
    InternalServerErrorException,
    UnauthorizedException,
} from '@nestjs/common';
import { CreateTradingAccountDto } from '../dto/create-trading-account.dto';
import { UpdateTradingAccountDto } from '../dto/update-trading-account.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TradingAccountRepositoryService } from '@/module-trading-account/services/trading-account-repository.service';
import { ApiKeysService } from '@/module-api-keys/services/api-keys.service';
import { ApiKey } from '@/module-api-keys/entities/api-key.entity';
import { TradingAccount } from '@/module-trading-account/entities/trading-account.entity';
import { TokenService } from '@/module-auth-token/services/token.service';
import { getUserIdFromToken } from '@/common/utils/get-user-id-from-tocken';
import type { Request } from 'express';

@Injectable()
export class TradingAccountService {
    constructor(
        @InjectQueue('excange-pnl-sync')
        private readonly exchangePnlQueue: Queue,
        private readonly tokenService: TokenService,
        private readonly tradingAccountRepositoryService: TradingAccountRepositoryService,
        private readonly apiKeysService: ApiKeysService,
    ) {}

    async create(
        createTradingAccountDto: CreateTradingAccountDto,
    ): Promise<Partial<TradingAccount> | null | undefined> {
        try {
            const apiKeyData: ApiKey | null = await this.apiKeysService.getActiveUserApiCredentials(
                createTradingAccountDto.apiKeyId,
            );

            if (apiKeyData) {
                const result = await this.tradingAccountRepositoryService.saveTradingAccount({
                    userId: apiKeyData.userId,
                    apiKey: { id: createTradingAccountDto.apiKeyId } as ApiKey,
                    exchangeUserAccountId: apiKeyData.exchangeUserAccountId,
                    market: createTradingAccountDto.market,
                    tradingAccountName: createTradingAccountDto.tradingAccountName,
                    exchange: apiKeyData.exchange,
                });

                await this.exchangePnlQueue.add('excange-pnl-sync', {
                    tradingAccountId: result.id,
                    market: result.market,
                    apiKey: apiKeyData.apiKey,
                    secretKey: apiKeyData.secretKey,
                    exchange: apiKeyData.exchange,
                });

                return {
                    id: result.id,
                    tradingAccountName: result.tradingAccountName,
                    exchange: result.exchange,
                    market: result.market,
                    apiKey: {
                        apiKeyName: apiKeyData.apiKeyName,
                    } as ApiKey,
                };
            }

            return null;
        } catch (error) {
            this.handleUnexpectedError(error, 'Failed to create trading account');
        }
    }

    async findAll(request: Request): Promise<TradingAccount[]> {
        const userId = getUserIdFromToken(request, this.tokenService);

        if (!userId) {
            throw new UnauthorizedException('Invalid or missing user.');
        }

        return await this.tradingAccountRepositoryService.findTradingAccountsByUserId(userId);
    }

    findOne(id: number) {
        return `This action returns a #${id} tradingAccount`;
    }

    update(id: number, _updateTradingAccountDto: UpdateTradingAccountDto) {
        void _updateTradingAccountDto;
        return `This action updates a #${id} tradingAccount`;
    }

    remove(id: number) {
        return `This action removes a #${id} tradingAccount`;
    }

    private handleUnexpectedError(error: unknown, message: string): never {
        if (error instanceof HttpException) {
            throw error;
        }

        throw new InternalServerErrorException(message);
    }
}
