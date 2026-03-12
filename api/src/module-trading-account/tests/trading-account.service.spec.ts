import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { Queue } from 'bullmq';
import { TradingAccountService } from '@/module-trading-account/services/trading-account.service';
import { TokenService } from '@/module-auth-token/services/token.service';
import { TradingAccountRepositoryService } from '@/module-trading-account/services/trading-account-repository.service';
import { ApiKeysService } from '@/module-api-keys/services/api-keys.service';
import { getUserIdFromToken } from '@/common/utils/get-user-id-from-tocken';
import { CreateTradingAccountDto } from '@/module-trading-account/dto/create-trading-account.dto';
import { Exchanges, MarketTypes } from '@/module-api-keys/enums';
import { ApiKey } from '@/module-api-keys/entities/api-key.entity';

jest.mock('@/common/utils/get-user-id-from-tocken', () => ({
    getUserIdFromToken: jest.fn(),
}));

describe('TradingAccountService', () => {
    let service: TradingAccountService;
    let queue: jest.Mocked<Queue>;
    let tokenService: jest.Mocked<TokenService>;
    let repository: jest.Mocked<TradingAccountRepositoryService>;
    let apiKeysService: jest.Mocked<ApiKeysService>;

    const dto: CreateTradingAccountDto = {
        apiKeyId: 'api-key-id',
        exchange: Exchanges.BYBIT,
        market: MarketTypes.FUTURES,
        tradingAccountName: 'Primary',
    } as CreateTradingAccountDto;

    beforeEach(() => {
        queue = { add: jest.fn() } as unknown as jest.Mocked<Queue>;
        tokenService = {} as jest.Mocked<TokenService>;
        repository = {
            saveTradingAccount: jest.fn(),
            findTradingAccountsByUserId: jest.fn(),
        } as unknown as jest.Mocked<TradingAccountRepositoryService>;
        apiKeysService = {
            getActiveUserApiCredentials: jest.fn(),
        } as unknown as jest.Mocked<ApiKeysService>;

        service = new TradingAccountService(queue, tokenService, repository, apiKeysService);
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
            } as never);

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

        it('wraps persistence errors in BadRequestException', async () => {
            apiKeysService.getActiveUserApiCredentials.mockResolvedValue({} as ApiKey);
            repository.saveTradingAccount.mockRejectedValue(new Error('db error'));

            await expect(service.create(dto)).rejects.toBeInstanceOf(BadRequestException);
        });
    });

    describe('findAll', () => {
        const request = { cookies: {} } as Request;

        it('returns trading accounts for authenticated user', async () => {
            (getUserIdFromToken as jest.Mock).mockReturnValue('user-id');
            const data = [{ id: 'acc-1' }];
            repository.findTradingAccountsByUserId.mockResolvedValue(data as never);

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
