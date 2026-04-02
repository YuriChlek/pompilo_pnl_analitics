import {
    BadRequestException,
    ConflictException,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { DataSource, EntityManager } from 'typeorm';
import { TradingAccountService } from '@/module-trading-account/services/trading-account.service';
import { TradingAccountRepositoryService } from '@/module-trading-account/services/trading-account-repository.service';
import { TradingAccountBindingRepositoryService } from '@/module-trading-account/services/trading-account-binding.repository.service';
import { TradingAccountSyncService } from '@/module-trading-account/services/trading-account-sync.service';
import { TradingAccountAccessService } from '@/module-trading-account/services/trading-account-access.service';
import { TradingAccountViewService } from '@/module-trading-account/services/trading-account-view.service';
import { buildTradingAccountDto } from '../../fixtures/trading.fixtures';
import { EXCHANGES, MARKET_TYPES } from '@/module-api-keys/enums/api-keys.enums';
import { ApiKey } from '@/module-api-keys/entities/api-key.entity';

type AwaitedReturn<T> = T extends Promise<infer R> ? R : T;

describe('TradingAccountService', () => {
    let service: TradingAccountService;
    let tradingAccountSyncService: {
        enqueueExchangePnlSync: jest.MockedFunction<
            TradingAccountSyncService['enqueueExchangePnlSync']
        >;
    };
    let repository: {
        saveTradingAccount: jest.MockedFunction<
            TradingAccountRepositoryService['saveTradingAccount']
        >;
        findTradingAccountsByUserId: jest.MockedFunction<
            TradingAccountRepositoryService['findTradingAccountsByUserId']
        >;
        updateTradingAccount: jest.MockedFunction<
            TradingAccountRepositoryService['updateTradingAccount']
        >;
        removeTradingAccount: jest.MockedFunction<
            TradingAccountRepositoryService['removeTradingAccount']
        >;
    };
    let bindingRepository: {
        saveTradingAccountBinding: jest.MockedFunction<
            TradingAccountBindingRepositoryService['saveTradingAccountBinding']
        >;
        findTradingAccountBindingsByTradingAccountIds: jest.MockedFunction<
            TradingAccountBindingRepositoryService['findTradingAccountBindingsByTradingAccountIds']
        >;
        findTradingAccountBindingByTradingAccountId: jest.MockedFunction<
            TradingAccountBindingRepositoryService['findTradingAccountBindingByTradingAccountId']
        >;
        updateTradingAccountBindingApiKey: jest.MockedFunction<
            TradingAccountBindingRepositoryService['updateTradingAccountBindingApiKey']
        >;
    };
    let tradingAccountAccessService: {
        getAuthorizedUserId: jest.MockedFunction<TradingAccountAccessService['getAuthorizedUserId']>;
        getOwnedTradingAccount: jest.MockedFunction<
            TradingAccountAccessService['getOwnedTradingAccount']
        >;
        getOwnedActiveApiKey: jest.MockedFunction<
            TradingAccountAccessService['getOwnedActiveApiKey']
        >;
        getRequiredOwnedActiveApiKey: jest.MockedFunction<
            TradingAccountAccessService['getRequiredOwnedActiveApiKey']
        >;
        ensureApiKeyIsAvailable: jest.MockedFunction<
            TradingAccountAccessService['ensureApiKeyIsAvailable']
        >;
    };
    let tradingAccountViewService: {
        buildTradingAccountSummary: jest.MockedFunction<
            TradingAccountViewService['buildTradingAccountSummary']
        >;
        toApiKeySummary: jest.MockedFunction<TradingAccountViewService['toApiKeySummary']>;
    };
    let dataSource: {
        transaction: jest.MockedFunction<DataSource['transaction']>;
    };

    const dto = buildTradingAccountDto();

    beforeEach(() => {
        tradingAccountSyncService = { enqueueExchangePnlSync: jest.fn() };
        repository = {
            saveTradingAccount: jest.fn(),
            findTradingAccountsByUserId: jest.fn(),
            updateTradingAccount: jest.fn(),
            removeTradingAccount: jest.fn(),
        };
        bindingRepository = {
            saveTradingAccountBinding: jest.fn(),
            findTradingAccountBindingsByTradingAccountIds: jest.fn(),
            findTradingAccountBindingByTradingAccountId: jest.fn(),
            updateTradingAccountBindingApiKey: jest.fn(),
        };
        tradingAccountAccessService = {
            getAuthorizedUserId: jest.fn(),
            getOwnedTradingAccount: jest.fn(),
            getOwnedActiveApiKey: jest.fn(),
            getRequiredOwnedActiveApiKey: jest.fn(),
            ensureApiKeyIsAvailable: jest.fn(),
        };
        tradingAccountViewService = {
            buildTradingAccountSummary: jest.fn((tradingAccount, apiKey) => ({
                id: tradingAccount.id,
                tradingAccountName: tradingAccount.tradingAccountName,
                exchange: tradingAccount.exchange,
                market: tradingAccount.market,
                apiKeyId: apiKey?.id ?? null,
                apiKey: apiKey ? { apiKeyName: apiKey.apiKeyName } : null,
            })),
            toApiKeySummary: jest.fn(apiKey =>
                apiKey
                    ? {
                          id: apiKey.id,
                          apiKeyName: apiKey.apiKeyName,
                      }
                    : null,
            ),
        };
        dataSource = {
            transaction: jest.fn(async callback => callback({} as EntityManager)),
        };

        service = new TradingAccountService(
            dataSource as unknown as DataSource,
            repository as unknown as TradingAccountRepositoryService,
            bindingRepository as unknown as TradingAccountBindingRepositoryService,
            tradingAccountSyncService as unknown as TradingAccountSyncService,
            tradingAccountAccessService as unknown as TradingAccountAccessService,
            tradingAccountViewService as unknown as TradingAccountViewService,
        );
        jest.clearAllMocks();
    });

    describe('create', () => {
        const request = { cookies: {} } as Request;

        it('saves trading account, enqueues sync job, and returns summary data', async () => {
            tradingAccountAccessService.getAuthorizedUserId.mockReturnValue('user-id');
            tradingAccountAccessService.getOwnedActiveApiKey.mockResolvedValue({
                id: 'api-key-id',
                userId: 'user-id',
                apiKeyName: 'API Key',
                apiKey: 'APIKEY',
                secretKey: 'SECRET',
                exchange: EXCHANGES.BYBIT,
                market: MARKET_TYPES.FUTURES,
                exchangeUserAccountId: 'acc-1',
            } as ApiKey);
            repository.saveTradingAccount.mockResolvedValue({
                id: 'account-id',
                tradingAccountName: dto.tradingAccountName,
                exchange: dto.exchange,
                market: dto.market,
            } as AwaitedReturn<ReturnType<TradingAccountRepositoryService['saveTradingAccount']>>);

            const result = await service.create(request, dto);

            expect(repository.saveTradingAccount).toHaveBeenCalledWith(
                expect.objectContaining({ userId: 'user-id', exchangeUserAccountId: 'acc-1' }),
                expect.any(Object),
            );
            expect(bindingRepository.saveTradingAccountBinding).toHaveBeenCalledWith(
                {
                    tradingAccountId: 'account-id',
                    apiKeyId: dto.apiKeyId,
                },
                expect.any(Object),
            );
            expect(tradingAccountAccessService.ensureApiKeyIsAvailable).toHaveBeenCalledWith(
                dto.apiKeyId,
            );
            expect(tradingAccountSyncService.enqueueExchangePnlSync).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'account-id',
                    market: dto.market,
                }),
                expect.objectContaining({
                    apiKey: 'APIKEY',
                    secretKey: 'SECRET',
                    exchange: EXCHANGES.BYBIT,
                }),
            );
            expect(result).toEqual({
                id: 'account-id',
                tradingAccountName: dto.tradingAccountName,
                exchange: dto.exchange,
                market: dto.market,
                apiKeyId: 'api-key-id',
                apiKey: { apiKeyName: 'API Key' },
            });
        });

        it('returns null when API key is not found', async () => {
            tradingAccountAccessService.getAuthorizedUserId.mockReturnValue('user-id');
            tradingAccountAccessService.getOwnedActiveApiKey.mockResolvedValue(null);

            const result = await service.create(request, dto);

            expect(result).toBeNull();
            expect(repository.saveTradingAccount).not.toHaveBeenCalled();
            expect(bindingRepository.saveTradingAccountBinding).not.toHaveBeenCalled();
        });

        it('converts unexpected persistence errors into InternalServerErrorException', async () => {
            tradingAccountAccessService.getAuthorizedUserId.mockReturnValue('user-id');
            tradingAccountAccessService.getOwnedActiveApiKey.mockResolvedValue({
                id: dto.apiKeyId,
                userId: 'user-id',
            } as ApiKey);
            repository.saveTradingAccount.mockRejectedValue(new Error('db error'));

            await expect(service.create(request, dto)).rejects.toBeInstanceOf(
                InternalServerErrorException,
            );
        });

        it('rejects create when api key is already linked to another trading account', async () => {
            tradingAccountAccessService.getAuthorizedUserId.mockReturnValue('user-id');
            tradingAccountAccessService.getOwnedActiveApiKey.mockResolvedValue({
                id: dto.apiKeyId,
                userId: 'user-id',
            } as ApiKey);
            tradingAccountAccessService.ensureApiKeyIsAvailable.mockRejectedValue(
                new ConflictException('duplicate'),
            );

            await expect(service.create(request, dto)).rejects.toBeInstanceOf(ConflictException);
            expect(repository.saveTradingAccount).not.toHaveBeenCalled();
        });

        it('rejects create when api key belongs to another user', async () => {
            tradingAccountAccessService.getAuthorizedUserId.mockReturnValue('user-id');
            tradingAccountAccessService.getOwnedActiveApiKey.mockRejectedValue(
                new UnauthorizedException(),
            );

            await expect(service.create(request, dto)).rejects.toBeInstanceOf(
                UnauthorizedException,
            );
            expect(repository.saveTradingAccount).not.toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        const request = { cookies: {} } as Request;

        it('returns trading accounts for authenticated user', async () => {
            tradingAccountAccessService.getAuthorizedUserId.mockReturnValue('user-id');
            const data = [
                {
                    id: 'acc-1',
                    tradingAccountName: 'Primary',
                    exchange: EXCHANGES.BYBIT,
                    market: MARKET_TYPES.FUTURES,
                },
            ];
            repository.findTradingAccountsByUserId.mockResolvedValue(
                data as AwaitedReturn<
                    ReturnType<TradingAccountRepositoryService['findTradingAccountsByUserId']>
                >,
            );
            bindingRepository.findTradingAccountBindingsByTradingAccountIds.mockResolvedValue([
                {
                    tradingAccountId: 'acc-1',
                    apiKey: {
                        id: 'api-key-id',
                        apiKeyName: 'Main API key',
                    },
                },
            ] as AwaitedReturn<
                ReturnType<
                    TradingAccountBindingRepositoryService['findTradingAccountBindingsByTradingAccountIds']
                >
            >);

            const result = await service.findAll(request);

            expect(result).toEqual([
                {
                    id: 'acc-1',
                    tradingAccountName: 'Primary',
                    exchange: EXCHANGES.BYBIT,
                    market: MARKET_TYPES.FUTURES,
                    apiKeyId: 'api-key-id',
                    apiKey: {
                        apiKeyName: 'Main API key',
                    },
                },
            ]);
            expect(repository.findTradingAccountsByUserId).toHaveBeenCalledWith('user-id');
            expect(
                bindingRepository.findTradingAccountBindingsByTradingAccountIds,
            ).toHaveBeenCalledWith(['acc-1']);
        });

        it('throws UnauthorizedException when token is missing', async () => {
            tradingAccountAccessService.getAuthorizedUserId.mockImplementation(() => {
                throw new UnauthorizedException();
            });

            await expect(service.findAll(request)).rejects.toBeInstanceOf(UnauthorizedException);
        });
    });

    describe('update', () => {
        const request = { cookies: {} } as Request;

        it('updates account name and binding api key for the owner', async () => {
            tradingAccountAccessService.getAuthorizedUserId.mockReturnValue('user-id');
            tradingAccountAccessService.getOwnedTradingAccount.mockResolvedValue({
                id: 'account-id',
                userId: 'user-id',
                tradingAccountName: 'Old name',
                exchange: EXCHANGES.BYBIT,
                market: MARKET_TYPES.FUTURES,
                exchangeUserAccountId: 'acc-1',
            } as never);
            bindingRepository.findTradingAccountBindingByTradingAccountId.mockResolvedValue({
                tradingAccountId: 'account-id',
                apiKeyId: 'old-api-key-id',
                apiKey: {
                    id: 'old-api-key-id',
                    apiKeyName: 'Old API Key',
                },
            } as never);
            repository.updateTradingAccount.mockResolvedValue({ affected: 1 } as never);
            bindingRepository.updateTradingAccountBindingApiKey.mockResolvedValue({
                affected: 1,
            } as never);
            tradingAccountAccessService.getRequiredOwnedActiveApiKey.mockResolvedValue({
                id: 'new-api-key-id',
                userId: 'user-id',
                apiKeyName: 'New API Key',
                exchange: EXCHANGES.BYBIT,
                market: MARKET_TYPES.FUTURES,
                exchangeUserAccountId: 'acc-1',
            } as ApiKey);

            const result = await service.update(request, 'account-id', {
                tradingAccountName: 'New name',
                apiKeyId: 'new-api-key-id',
            });

            expect(repository.updateTradingAccount).toHaveBeenCalledWith(
                'account-id',
                { tradingAccountName: 'New name' },
                expect.any(Object),
            );
            expect(bindingRepository.updateTradingAccountBindingApiKey).toHaveBeenCalledWith(
                'account-id',
                'new-api-key-id',
                expect.any(Object),
            );
            expect(result).toEqual({
                id: 'account-id',
                tradingAccountName: 'New name',
                exchange: EXCHANGES.BYBIT,
                market: MARKET_TYPES.FUTURES,
                apiKeyId: 'new-api-key-id',
                apiKey: {
                    apiKeyName: 'New API Key',
                },
            });
        });

        it('rejects api key reassignment to another exchange account', async () => {
            tradingAccountAccessService.getAuthorizedUserId.mockReturnValue('user-id');
            tradingAccountAccessService.getOwnedTradingAccount.mockResolvedValue({
                id: 'account-id',
                userId: 'user-id',
                tradingAccountName: 'Old name',
                exchange: EXCHANGES.BYBIT,
                market: MARKET_TYPES.FUTURES,
                exchangeUserAccountId: 'acc-1',
            } as never);
            bindingRepository.findTradingAccountBindingByTradingAccountId.mockResolvedValue(null);
            tradingAccountAccessService.getRequiredOwnedActiveApiKey.mockResolvedValue({
                id: 'new-api-key-id',
                userId: 'user-id',
                apiKeyName: 'New API Key',
                exchange: EXCHANGES.BYBIT,
                market: MARKET_TYPES.FUTURES,
                exchangeUserAccountId: 'another-account',
            } as ApiKey);

            await expect(
                service.update(request, 'account-id', {
                    apiKeyId: 'new-api-key-id',
                }),
            ).rejects.toBeInstanceOf(BadRequestException);
        });

        it('rejects api key reassignment when api key is already used by another account', async () => {
            tradingAccountAccessService.getAuthorizedUserId.mockReturnValue('user-id');
            tradingAccountAccessService.getOwnedTradingAccount.mockResolvedValue({
                id: 'account-id',
                userId: 'user-id',
                tradingAccountName: 'Old name',
                exchange: EXCHANGES.BYBIT,
                market: MARKET_TYPES.FUTURES,
                exchangeUserAccountId: 'acc-1',
            } as never);
            bindingRepository.findTradingAccountBindingByTradingAccountId.mockResolvedValue({
                tradingAccountId: 'account-id',
                apiKeyId: 'old-api-key-id',
                apiKey: {
                    id: 'old-api-key-id',
                    apiKeyName: 'Old API Key',
                },
            } as never);
            tradingAccountAccessService.ensureApiKeyIsAvailable.mockRejectedValue(
                new ConflictException('duplicate'),
            );

            await expect(
                service.update(request, 'account-id', {
                    apiKeyId: 'new-api-key-id',
                }),
            ).rejects.toBeInstanceOf(ConflictException);
        });
    });

    describe('remove', () => {
        const request = { cookies: {} } as Request;

        it('removes account for the owner', async () => {
            tradingAccountAccessService.getAuthorizedUserId.mockReturnValue('user-id');
            tradingAccountAccessService.getOwnedTradingAccount.mockResolvedValue({
                id: 'account-id',
                userId: 'user-id',
            } as never);
            repository.removeTradingAccount.mockResolvedValue({ affected: 1 } as never);

            const result = await service.remove(request, 'account-id');

            expect(repository.removeTradingAccount).toHaveBeenCalledWith('account-id');
            expect(result).toEqual({ removed: true });
        });

        it('throws when trading account does not exist', async () => {
            tradingAccountAccessService.getAuthorizedUserId.mockReturnValue('user-id');
            tradingAccountAccessService.getOwnedTradingAccount.mockRejectedValue(
                new NotFoundException(),
            );

            await expect(service.remove(request, 'missing-id')).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });
    });
});
