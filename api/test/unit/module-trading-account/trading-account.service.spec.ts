import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { Queue } from 'bullmq';
import { TradingAccountService } from '@/module-trading-account/services/trading-account.service';
import { TokenService } from '@/module-auth-token/services/token.service';
import { TradingAccountRepositoryService } from '@/module-trading-account/services/trading-account-repository.service';
import { ApiKeysService } from '@/module-api-keys/services/api-keys.service';
import { getUserIdFromToken } from '@/common/utils/get-user-id-from-tocken';
import { ApiKey } from '@/module-api-keys/entities/api-key.entity';
import { buildTradingAccountDto } from '../../fixtures/trading.fixtures';
import { Exchanges, MarketTypes } from '@/module-api-keys/enums';

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
    };
    let apiKeysService: {
        getActiveUserApiCredentials: jest.MockedFunction<
            ApiKeysService['getActiveUserApiCredentials']
        >;
    };

    const dto = buildTradingAccountDto();

    beforeEach(() => {
        queue = { add: jest.fn() };
        tokenService = {} as TokenService;
        repository = {
            saveTradingAccount: jest.fn(),
            findTradingAccountsByUserId: jest.fn(),
        };
        apiKeysService = {
            getActiveUserApiCredentials: jest.fn(),
        };

        service = new TradingAccountService(
            queue as unknown as Queue,
            tokenService,
            repository as unknown as TradingAccountRepositoryService,
            apiKeysService as unknown as ApiKeysService,
        );
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('saves trading account, enqueues sync job, and returns summary data', async () => {
            apiKeysService.getActiveUserApiCredentials.mockResolvedValue({
                id: 'api-key-id',
                userId: 'user-id',
                apiKeyName: 'API Key',
                apiKey: 'APIKEY',
                secretKey: 'SECRET',
                exchange: Exchanges.BYBIT,
                market: MarketTypes.FUTURES,
                exchangeUserAccountId: 'acc-1',
            } as ApiKey);
            repository.saveTradingAccount.mockResolvedValue({
                id: 'account-id',
                tradingAccountName: dto.tradingAccountName,
                exchange: dto.exchange,
                market: dto.market,
            } as AwaitedReturn<ReturnType<TradingAccountRepositoryService['saveTradingAccount']>>);

            const result = await service.create(dto);

            expect(repository.saveTradingAccount).toHaveBeenCalledWith(
                expect.objectContaining({ userId: 'user-id', exchangeUserAccountId: 'acc-1' }),
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
                apiKey: { apiKeyName: 'API Key' },
            });
        });

        it('returns null when API key is not found', async () => {
            apiKeysService.getActiveUserApiCredentials.mockResolvedValue(null);

            const result = await service.create(dto);

            expect(result).toBeNull();
            expect(repository.saveTradingAccount).not.toHaveBeenCalled();
        });

        it('converts unexpected persistence errors into InternalServerErrorException', async () => {
            apiKeysService.getActiveUserApiCredentials.mockResolvedValue({} as ApiKey);
            repository.saveTradingAccount.mockRejectedValue(new Error('db error'));

            await expect(service.create(dto)).rejects.toBeInstanceOf(InternalServerErrorException);
        });
    });

    describe('findAll', () => {
        const request = { cookies: {} } as Request;

        it('returns trading accounts for authenticated user', async () => {
            (getUserIdFromToken as jest.Mock).mockReturnValue('user-id');
            const data = [{ id: 'acc-1' }];
            repository.findTradingAccountsByUserId.mockResolvedValue(
                data as AwaitedReturn<
                    ReturnType<TradingAccountRepositoryService['findTradingAccountsByUserId']>
                >,
            );

            const result = await service.findAll(request);

            expect(result).toBe(data);
            expect(repository.findTradingAccountsByUserId).toHaveBeenCalledWith('user-id');
        });

        it('throws UnauthorizedException when token is missing', async () => {
            (getUserIdFromToken as jest.Mock).mockReturnValue(null);

            await expect(service.findAll(request)).rejects.toBeInstanceOf(UnauthorizedException);
        });
    });
});
