import {
    BadRequestException,
    ConflictException,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { Queue } from 'bullmq';
import { TradingAccountService } from '@/module-trading-account/services/trading-account.service';
import { TokenService } from '@/module-auth-token/services/token.service';
import { TradingAccountRepositoryService } from '@/module-trading-account/services/trading-account-repository.service';
import { TradingAccountBindingRepositoryService } from '@/module-trading-account/services/trading-account-binding.repository.service';
import { ApiKeysService } from '@/module-api-keys/services/api-keys.service';
import { getUserIdFromToken } from '@/common/utils/get-user-id-from-tocken';
import { ApiKey } from '@/module-api-keys/entities/api-key.entity';
import { buildTradingAccountDto } from '../../fixtures/trading.fixtures';
import { EXCHANGES, MARKET_TYPES } from '@/module-api-keys/enums/api-keys-enums';
import { DataSource, EntityManager } from 'typeorm';

type AwaitedReturn<T> = T extends Promise<infer R> ? R : T;

jest.mock('@/common/utils/get-user-id-from-tocken', () => ({
    getUserIdFromToken: jest.fn(),
}));

describe('TradingAccountService', () => {
    let service: TradingAccountService;
    let queue: {
        add: jest.MockedFunction<Queue['add']>;
    };
    let tokenService: TokenService;
    let repository: {
        saveTradingAccount: jest.MockedFunction<
            TradingAccountRepositoryService['saveTradingAccount']
        >;
        findTradingAccountsByUserId: jest.MockedFunction<
            TradingAccountRepositoryService['findTradingAccountsByUserId']
        >;
        findTradingAccountById: jest.MockedFunction<
            TradingAccountRepositoryService['findTradingAccountById']
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
        findTradingAccountBindingByApiKeyId: jest.MockedFunction<
            TradingAccountBindingRepositoryService['findTradingAccountBindingByApiKeyId']
        >;
        updateTradingAccountBindingApiKey: jest.MockedFunction<
            TradingAccountBindingRepositoryService['updateTradingAccountBindingApiKey']
        >;
    };
    let apiKeysService: {
        getActiveUserApiCredentials: jest.MockedFunction<
            ApiKeysService['getActiveUserApiCredentials']
        >;
    };
    let dataSource: {
        transaction: jest.MockedFunction<DataSource['transaction']>;
    };

    const dto = buildTradingAccountDto();

    beforeEach(() => {
        queue = { add: jest.fn() };
        tokenService = {} as TokenService;
        repository = {
            saveTradingAccount: jest.fn(),
            findTradingAccountsByUserId: jest.fn(),
            findTradingAccountById: jest.fn(),
            updateTradingAccount: jest.fn(),
            removeTradingAccount: jest.fn(),
        };
        bindingRepository = {
            saveTradingAccountBinding: jest.fn(),
            findTradingAccountBindingsByTradingAccountIds: jest.fn(),
            findTradingAccountBindingByTradingAccountId: jest.fn(),
            findTradingAccountBindingByApiKeyId: jest.fn(),
            updateTradingAccountBindingApiKey: jest.fn(),
        };
        apiKeysService = {
            getActiveUserApiCredentials: jest.fn(),
        };
        dataSource = {
            transaction: jest.fn(async callback => callback({} as EntityManager)),
        };

        service = new TradingAccountService(
            queue as unknown as Queue,
            dataSource as unknown as DataSource,
            tokenService,
            repository as unknown as TradingAccountRepositoryService,
            bindingRepository as unknown as TradingAccountBindingRepositoryService,
            apiKeysService as unknown as ApiKeysService,
        );
        jest.clearAllMocks();
    });

    describe('create', () => {
        const request = { cookies: {} } as Request;

        it('saves trading account, enqueues sync job, and returns summary data', async () => {
            (getUserIdFromToken as jest.Mock).mockReturnValue('user-id');
            apiKeysService.getActiveUserApiCredentials.mockResolvedValue({
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
            bindingRepository.findTradingAccountBindingByApiKeyId.mockResolvedValue(null);

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
            expect(queue.add).toHaveBeenCalledWith(
                'excange-pnl-sync',
                expect.objectContaining({
                    tradingAccountId: 'account-id',
                    market: dto.market,
                    apiKey: 'APIKEY',
                    secretKey: 'SECRET',
                }),
            );
            expect(result).toEqual({
                id: 'account-id',
                tradingAccountName: dto.tradingAccountName,
                exchange: dto.exchange,
                market: dto.market,
                apiKeyId: dto.apiKeyId,
                apiKey: { apiKeyName: 'API Key' },
            });
        });

        it('returns null when API key is not found', async () => {
            (getUserIdFromToken as jest.Mock).mockReturnValue('user-id');
            apiKeysService.getActiveUserApiCredentials.mockResolvedValue(null);

            const result = await service.create(request, dto);

            expect(result).toBeNull();
            expect(repository.saveTradingAccount).not.toHaveBeenCalled();
            expect(bindingRepository.saveTradingAccountBinding).not.toHaveBeenCalled();
        });

        it('converts unexpected persistence errors into InternalServerErrorException', async () => {
            (getUserIdFromToken as jest.Mock).mockReturnValue('user-id');
            apiKeysService.getActiveUserApiCredentials.mockResolvedValue({
                id: dto.apiKeyId,
                userId: 'user-id',
            } as ApiKey);
            bindingRepository.findTradingAccountBindingByApiKeyId.mockResolvedValue(null);
            repository.saveTradingAccount.mockRejectedValue(new Error('db error'));

            await expect(service.create(request, dto)).rejects.toBeInstanceOf(
                InternalServerErrorException,
            );
        });

        it('rejects create when api key is already linked to another trading account', async () => {
            (getUserIdFromToken as jest.Mock).mockReturnValue('user-id');
            apiKeysService.getActiveUserApiCredentials.mockResolvedValue({
                id: dto.apiKeyId,
                userId: 'user-id',
            } as ApiKey);
            bindingRepository.findTradingAccountBindingByApiKeyId.mockResolvedValue({
                tradingAccountId: 'existing-account',
                apiKeyId: dto.apiKeyId,
            } as never);

            await expect(service.create(request, dto)).rejects.toBeInstanceOf(ConflictException);
            expect(repository.saveTradingAccount).not.toHaveBeenCalled();
        });

        it('rejects create when api key belongs to another user', async () => {
            (getUserIdFromToken as jest.Mock).mockReturnValue('user-id');
            apiKeysService.getActiveUserApiCredentials.mockResolvedValue({
                id: dto.apiKeyId,
                userId: 'another-user-id',
            } as ApiKey);

            await expect(service.create(request, dto)).rejects.toBeInstanceOf(
                UnauthorizedException,
            );
            expect(repository.saveTradingAccount).not.toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        const request = { cookies: {} } as Request;

        it('returns trading accounts for authenticated user', async () => {
            (getUserIdFromToken as jest.Mock).mockReturnValue('user-id');
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
            (getUserIdFromToken as jest.Mock).mockReturnValue(null);

            await expect(service.findAll(request)).rejects.toBeInstanceOf(UnauthorizedException);
        });
    });

    describe('update', () => {
        const request = { cookies: {} } as Request;

        it('updates account name and binding api key for the owner', async () => {
            (getUserIdFromToken as jest.Mock).mockReturnValue('user-id');
            repository.findTradingAccountById.mockResolvedValue({
                id: 'account-id',
                userId: 'user-id',
                tradingAccountName: 'Old name',
                exchange: EXCHANGES.BYBIT,
                market: MARKET_TYPES.FUTURES,
                exchangeUserAccountId: 'acc-1',
            } as AwaitedReturn<
                ReturnType<TradingAccountRepositoryService['findTradingAccountById']>
            >);
            bindingRepository.findTradingAccountBindingByTradingAccountId.mockResolvedValue({
                tradingAccountId: 'account-id',
                apiKeyId: 'old-api-key-id',
                apiKey: {
                    id: 'old-api-key-id',
                    apiKeyName: 'Old API Key',
                },
            } as AwaitedReturn<
                ReturnType<
                    TradingAccountBindingRepositoryService['findTradingAccountBindingByTradingAccountId']
                >
            >);
            repository.updateTradingAccount.mockResolvedValue({ affected: 1 } as never);
            bindingRepository.updateTradingAccountBindingApiKey.mockResolvedValue({
                affected: 1,
            } as never);
            bindingRepository.findTradingAccountBindingByApiKeyId.mockResolvedValue(null);
            apiKeysService.getActiveUserApiCredentials.mockResolvedValue({
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
            (getUserIdFromToken as jest.Mock).mockReturnValue('user-id');
            repository.findTradingAccountById.mockResolvedValue({
                id: 'account-id',
                userId: 'user-id',
                tradingAccountName: 'Old name',
                exchange: EXCHANGES.BYBIT,
                market: MARKET_TYPES.FUTURES,
                exchangeUserAccountId: 'acc-1',
            } as AwaitedReturn<
                ReturnType<TradingAccountRepositoryService['findTradingAccountById']>
            >);
            bindingRepository.findTradingAccountBindingByTradingAccountId.mockResolvedValue(null);
            bindingRepository.findTradingAccountBindingByApiKeyId.mockResolvedValue(null);
            apiKeysService.getActiveUserApiCredentials.mockResolvedValue({
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
            (getUserIdFromToken as jest.Mock).mockReturnValue('user-id');
            repository.findTradingAccountById.mockResolvedValue({
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
            bindingRepository.findTradingAccountBindingByApiKeyId.mockResolvedValue({
                tradingAccountId: 'another-account-id',
                apiKeyId: 'new-api-key-id',
            } as never);

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
            (getUserIdFromToken as jest.Mock).mockReturnValue('user-id');
            repository.findTradingAccountById.mockResolvedValue({
                id: 'account-id',
                userId: 'user-id',
            } as AwaitedReturn<
                ReturnType<TradingAccountRepositoryService['findTradingAccountById']>
            >);
            repository.removeTradingAccount.mockResolvedValue({ affected: 1 } as never);

            const result = await service.remove(request, 'account-id');

            expect(repository.removeTradingAccount).toHaveBeenCalledWith('account-id');
            expect(result).toEqual({ removed: true });
        });

        it('throws when trading account does not exist', async () => {
            (getUserIdFromToken as jest.Mock).mockReturnValue('user-id');
            repository.findTradingAccountById.mockResolvedValue(null);

            await expect(service.remove(request, 'missing-id')).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });
    });
});
