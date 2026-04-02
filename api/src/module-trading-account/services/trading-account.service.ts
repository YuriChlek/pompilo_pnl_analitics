import {
    BadRequestException,
    HttpException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { CreateTradingAccountDto } from '@/module-trading-account/dto/create-trading-account.dto';
import { UpdateTradingAccountDto } from '@/module-trading-account/dto/update-trading-account.dto';
import { TradingAccountRepositoryService } from '@/module-trading-account/services/trading-account-repository.service';
import { TradingAccountBindingRepositoryService } from '@/module-trading-account/services/trading-account-binding.repository.service';
import type { Request } from 'express';
import { DataSource, DeleteResult, UpdateResult } from 'typeorm';
import { TradingAccountSummary } from '@/module-trading-account/types/trading-account.types';
import { TradingAccountSyncService } from '@/module-trading-account/services/trading-account-sync.service';
import { TradingAccountAccessService } from '@/module-trading-account/services/trading-account-access.service';
import { TradingAccountViewService } from '@/module-trading-account/services/trading-account-view.service';

@Injectable()
export class TradingAccountService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly tradingAccountRepositoryService: TradingAccountRepositoryService,
        private readonly tradingAccountBindingRepositoryService: TradingAccountBindingRepositoryService,
        private readonly tradingAccountSyncService: TradingAccountSyncService,
        private readonly tradingAccountAccessService: TradingAccountAccessService,
        private readonly tradingAccountViewService: TradingAccountViewService,
    ) {}

    async create(
        request: Request,
        createTradingAccountDto: CreateTradingAccountDto,
    ): Promise<TradingAccountSummary | null | undefined> {
        try {
            const userId = this.tradingAccountAccessService.getAuthorizedUserId(request);
            const apiKeyData = await this.tradingAccountAccessService.getOwnedActiveApiKey(
                userId,
                createTradingAccountDto.apiKeyId,
            );

            if (apiKeyData) {
                await this.tradingAccountAccessService.ensureApiKeyIsAvailable(
                    createTradingAccountDto.apiKeyId,
                );

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

                await this.tradingAccountSyncService.enqueueExchangePnlSync(result, apiKeyData);

                return this.tradingAccountViewService.buildTradingAccountSummary(
                    result,
                    this.tradingAccountViewService.toApiKeySummary(apiKeyData),
                );
            }

            return null;
        } catch (error) {
            this.handleUnexpectedError(error, 'Failed to create trading account');
        }
    }

    async findAll(request: Request): Promise<TradingAccountSummary[]> {
        const userId = this.tradingAccountAccessService.getAuthorizedUserId(request);

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
            this.tradingAccountViewService.buildTradingAccountSummary(
                account,
                this.tradingAccountViewService.toApiKeySummary(
                    apiKeyByTradingAccountId.get(account.id) ?? null,
                ),
            ),
        );
    }

    async update(
        request: Request,
        tradingAccountId: string,
        updateTradingAccountDto: UpdateTradingAccountDto,
    ): Promise<TradingAccountSummary> {
        try {
            const userId = this.tradingAccountAccessService.getAuthorizedUserId(request);
            const existingTradingAccount =
                await this.tradingAccountAccessService.getOwnedTradingAccount(
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

            let apiKeySummary =
                this.tradingAccountViewService.toApiKeySummary(existingBinding?.apiKey);

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
                    await this.tradingAccountAccessService.ensureApiKeyIsAvailable(
                        nextApiKeyId,
                        tradingAccountId,
                    );
                    const nextApiKeyData =
                        await this.tradingAccountAccessService.getRequiredOwnedActiveApiKey(
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

                    apiKeySummary = this.tradingAccountViewService.toApiKeySummary(nextApiKeyData);
                }
            });

            return this.tradingAccountViewService.buildTradingAccountSummary(
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
            const userId = this.tradingAccountAccessService.getAuthorizedUserId(request);
            await this.tradingAccountAccessService.getOwnedTradingAccount(tradingAccountId, userId);

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
}
