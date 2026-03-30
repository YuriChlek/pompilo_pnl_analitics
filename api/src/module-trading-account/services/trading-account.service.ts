import {
    BadRequestException,
    ConflictException,
    HttpException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { CreateTradingAccountDto } from '@/module-trading-account/dto/create-trading-account.dto';
import { UpdateTradingAccountDto } from '@/module-trading-account/dto/update-trading-account.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TradingAccountRepositoryService } from '@/module-trading-account/services/trading-account-repository.service';
import { TradingAccountBindingRepositoryService } from '@/module-trading-account/services/trading-account-binding.repository.service';
import { ApiKeysService } from '@/module-api-keys/services/api-keys.service';
import { ApiKey } from '@/module-api-keys/entities/api-key.entity';
import { TokenService } from '@/module-auth-token/services/token.service';
import { getUserIdFromToken } from '@/common/utils/get-user-id-from-tocken';
import type { Request } from 'express';
import { DataSource, DeleteResult, UpdateResult } from 'typeorm';
import { TradingAccountApiKeySummary, TradingAccountSummary } from '@/module-trading-account/types';
import { TradingAccount } from '@/module-trading-account/entities/trading-account.entity';

@Injectable()
export class TradingAccountService {
    constructor(
        @InjectQueue('excange-pnl-sync')
        private readonly exchangePnlQueue: Queue,
        private readonly dataSource: DataSource,
        private readonly tokenService: TokenService,
        private readonly tradingAccountRepositoryService: TradingAccountRepositoryService,
        private readonly tradingAccountBindingRepositoryService: TradingAccountBindingRepositoryService,
        private readonly apiKeysService: ApiKeysService,
    ) {}

    async create(
        request: Request,
        createTradingAccountDto: CreateTradingAccountDto,
    ): Promise<TradingAccountSummary | null | undefined> {
        try {
            const userId = this.getAuthorizedUserId(request);
            const apiKeyData = await this.getOwnedActiveApiKey(
                userId,
                createTradingAccountDto.apiKeyId,
            );

            if (apiKeyData) {
                await this.ensureApiKeyIsAvailable(createTradingAccountDto.apiKeyId);

                const result = await this.dataSource.transaction(async entityManager => {
                    const tradingAccount =
                        await this.tradingAccountRepositoryService.saveTradingAccount(
                            {
                                userId: apiKeyData.userId,
                                exchangeUserAccountId: apiKeyData.exchangeUserAccountId,
                                market: createTradingAccountDto.market,
                                tradingAccountName: createTradingAccountDto.tradingAccountName,
                                exchange: apiKeyData.exchange,
                            },
                            entityManager,
                        );

                    await this.tradingAccountBindingRepositoryService.saveTradingAccountBinding(
                        {
                            tradingAccountId: tradingAccount.id,
                            apiKeyId: createTradingAccountDto.apiKeyId,
                        },
                        entityManager,
                    );

                    return tradingAccount;
                });

                await this.exchangePnlQueue.add('excange-pnl-sync', {
                    tradingAccountId: result.id,
                    market: result.market,
                    apiKey: apiKeyData.apiKey,
                    secretKey: apiKeyData.secretKey,
                    exchange: apiKeyData.exchange,
                });

                return this.buildTradingAccountSummary(result, {
                    id: createTradingAccountDto.apiKeyId,
                    apiKeyName: apiKeyData.apiKeyName,
                });
            }

            return null;
        } catch (error) {
            this.handleUnexpectedError(error, 'Failed to create trading account');
        }
    }

    async findAll(request: Request): Promise<TradingAccountSummary[]> {
        const userId = this.getAuthorizedUserId(request);

        const tradingAccounts =
            await this.tradingAccountRepositoryService.findTradingAccountsByUserId(userId);
        const tradingAccountBindings =
            await this.tradingAccountBindingRepositoryService.findTradingAccountBindingsByTradingAccountIds(
                tradingAccounts.map(account => account.id),
            );
        const apiKeyByTradingAccountId = new Map(
            tradingAccountBindings.map(binding => [
                binding.tradingAccountId,
                binding.apiKey
                    ? {
                          id: binding.apiKey.id,
                          apiKeyName: binding.apiKey.apiKeyName,
                      }
                    : null,
            ]),
        );

        return tradingAccounts.map(account =>
            this.buildTradingAccountSummary(
                account,
                apiKeyByTradingAccountId.get(account.id) ?? null,
            ),
        );
    }

    async update(
        request: Request,
        tradingAccountId: string,
        updateTradingAccountDto: UpdateTradingAccountDto,
    ): Promise<TradingAccountSummary> {
        try {
            const userId = this.getAuthorizedUserId(request);
            const existingTradingAccount = await this.getOwnedTradingAccount(
                tradingAccountId,
                userId,
            );

            const nextTradingAccountName = updateTradingAccountDto.tradingAccountName?.trim();
            const nextApiKeyId = updateTradingAccountDto.apiKeyId;

            if (!nextTradingAccountName && !nextApiKeyId) {
                throw new BadRequestException(
                    'At least one field is required to update trading account.',
                );
            }

            const existingBinding =
                await this.tradingAccountBindingRepositoryService.findTradingAccountBindingByTradingAccountId(
                    tradingAccountId,
                );

            let apiKeySummary = this.toApiKeySummary(existingBinding?.apiKey);

            await this.dataSource.transaction(async entityManager => {
                if (nextTradingAccountName) {
                    const data: UpdateResult =
                        await this.tradingAccountRepositoryService.updateTradingAccount(
                            tradingAccountId,
                            {
                                tradingAccountName: nextTradingAccountName,
                            },
                            entityManager,
                        );

                    if (!data.affected) {
                        throw new NotFoundException('Trading account not found.');
                    }
                }

                if (nextApiKeyId && nextApiKeyId !== existingBinding?.apiKeyId) {
                    await this.ensureApiKeyIsAvailable(nextApiKeyId, tradingAccountId);
                    const nextApiKeyData = await this.getRequiredOwnedActiveApiKey(
                        userId,
                        nextApiKeyId,
                    );

                    const isSameExchangeAccount =
                        nextApiKeyData.exchange === existingTradingAccount.exchange &&
                        nextApiKeyData.market === existingTradingAccount.market &&
                        nextApiKeyData.exchangeUserAccountId ===
                            existingTradingAccount.exchangeUserAccountId;

                    if (!isSameExchangeAccount) {
                        throw new BadRequestException(
                            'API key must belong to the same exchange account.',
                        );
                    }

                    if (existingBinding) {
                        const bindingUpdateResult: UpdateResult =
                            await this.tradingAccountBindingRepositoryService.updateTradingAccountBindingApiKey(
                                tradingAccountId,
                                nextApiKeyId,
                                entityManager,
                            );

                        if (!bindingUpdateResult.affected) {
                            throw new NotFoundException('Trading account binding not found.');
                        }
                    } else {
                        await this.tradingAccountBindingRepositoryService.saveTradingAccountBinding(
                            {
                                tradingAccountId,
                                apiKeyId: nextApiKeyId,
                            },
                            entityManager,
                        );
                    }

                    apiKeySummary = this.toApiKeySummary(nextApiKeyData);
                }
            });

            return this.buildTradingAccountSummary(
                {
                    ...existingTradingAccount,
                    tradingAccountName:
                        nextTradingAccountName ?? existingTradingAccount.tradingAccountName,
                },
                apiKeySummary,
            );
        } catch (error) {
            this.handleUnexpectedError(error, 'Failed to update trading account');
        }
    }

    async remove(request: Request, tradingAccountId: string): Promise<{ removed: boolean }> {
        try {
            const userId = this.getAuthorizedUserId(request);
            await this.getOwnedTradingAccount(tradingAccountId, userId);

            const data: DeleteResult =
                await this.tradingAccountRepositoryService.removeTradingAccount(tradingAccountId);

            if (!data.affected) {
                throw new NotFoundException('Trading account not found.');
            }

            return {
                removed: true,
            };
        } catch (error) {
            this.handleUnexpectedError(error, 'Failed to remove trading account');
        }
    }

    private handleUnexpectedError(error: unknown, message: string): never {
        if (error instanceof HttpException) {
            throw error;
        }

        throw new InternalServerErrorException(message);
    }

    private getAuthorizedUserId(request: Request): string {
        const userId = getUserIdFromToken(request, this.tokenService);

        if (!userId) {
            throw new UnauthorizedException('Invalid or missing user.');
        }

        return userId;
    }

    private async getOwnedTradingAccount(
        tradingAccountId: string,
        userId: string,
    ): Promise<TradingAccount> {
        const tradingAccount =
            await this.tradingAccountRepositoryService.findTradingAccountById(tradingAccountId);

        if (!tradingAccount) {
            throw new NotFoundException('Trading account not found.');
        }

        if (tradingAccount.userId !== userId) {
            throw new UnauthorizedException('Invalid or missing user.');
        }

        return tradingAccount;
    }

    private async getOwnedActiveApiKey(userId: string, apiKeyId: string): Promise<ApiKey | null> {
        const apiKeyData = await this.apiKeysService.getActiveUserApiCredentials(apiKeyId);

        if (!apiKeyData) {
            return null;
        }

        if (apiKeyData.userId !== userId) {
            throw new UnauthorizedException('Invalid or missing user.');
        }

        return apiKeyData;
    }

    private async getRequiredOwnedActiveApiKey(userId: string, apiKeyId: string): Promise<ApiKey> {
        const apiKeyData = await this.getOwnedActiveApiKey(userId, apiKeyId);

        if (!apiKeyData) {
            throw new BadRequestException('Provided API key is not active.');
        }

        return apiKeyData;
    }

    private async ensureApiKeyIsAvailable(
        apiKeyId: string,
        tradingAccountId?: string,
    ): Promise<void> {
        const existingBindingByApiKey =
            await this.tradingAccountBindingRepositoryService.findTradingAccountBindingByApiKeyId(
                apiKeyId,
            );

        if (
            existingBindingByApiKey &&
            existingBindingByApiKey.tradingAccountId !== tradingAccountId
        ) {
            throw new ConflictException('API key is already linked to another trading account.');
        }
    }

    private buildTradingAccountSummary(
        tradingAccount: Pick<TradingAccount, 'id' | 'tradingAccountName' | 'exchange' | 'market'>,
        apiKey: TradingAccountApiKeySummary | null,
    ): TradingAccountSummary {
        return {
            id: tradingAccount.id,
            tradingAccountName: tradingAccount.tradingAccountName,
            exchange: tradingAccount.exchange,
            market: tradingAccount.market,
            apiKeyId: apiKey?.id ?? null,
            apiKey: apiKey
                ? {
                      apiKeyName: apiKey.apiKeyName,
                  }
                : null,
        };
    }

    private toApiKeySummary(
        apiKey: Pick<ApiKey, 'id' | 'apiKeyName'> | null | undefined,
    ): TradingAccountApiKeySummary | null {
        if (!apiKey) {
            return null;
        }

        return {
            id: apiKey.id,
            apiKeyName: apiKey.apiKeyName,
        };
    }
}
