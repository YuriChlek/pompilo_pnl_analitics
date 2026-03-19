import { ConfigService } from '@nestjs/config';
import { HttpException, InternalServerErrorException } from '@nestjs/common';
import { BybitService } from '@/module-bybit/services/bybit.service';
import { TradesRepositoryService } from '@/module-trades/services/trades-repository.service';
import { Exchanges, MarketTypes } from '@/module-api-keys/enums/api-keys-enums';
import { FuturesClosedPnl } from '@/module-trades/entities/futures-closed-pnl.entity';

const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

type MockFetchResponse = {
    ok: boolean;
    status: number;
    json: jest.Mock<Promise<unknown>, []>;
};

describe('BybitService', () => {
    let service: BybitService;
    let configService: {
        getOrThrow: jest.MockedFunction<ConfigService['getOrThrow']>;
    };
    let repository: {
        saveClosedPnl: jest.MockedFunction<TradesRepositoryService['saveClosedPnl']>;
    };

    const createResponse = (data: unknown, ok = true, status = 200): MockFetchResponse => ({
        ok,
        status,
        json: jest.fn<Promise<unknown>, []>().mockResolvedValue(data),
    });

    beforeEach(() => {
        configService = {
            getOrThrow: jest.fn((key: string) =>
                key === 'BYBIT_URL' ? 'https://api.bybit.com' : 'https://api-demo.bybit.com',
            ),
        };
        repository = {
            saveClosedPnl: jest.fn(),
        };

        service = new BybitService(
            configService as unknown as ConfigService,
            repository as unknown as TradesRepositoryService,
        );
    });

    describe('getTradingPnl', () => {
        it('concatenates paginated responses until an empty page is returned', async () => {
            const fetchSpy = jest
                .spyOn<any, any>(service as any, 'fetchBybitData')
                .mockResolvedValueOnce(
                    createResponse({
                        retCode: 0,
                        retMsg: 'OK',
                        result: { list: [{ closedPnl: '10' }] },
                    }),
                )
                .mockResolvedValueOnce(
                    createResponse({
                        retCode: 0,
                        retMsg: 'OK',
                        result: { list: [] },
                    }),
                );

            const result = await service.getTradingPnl(
                Exchanges.BYBIT,
                'apiKey',
                'secret',
                MarketTypes.FUTURES,
                '0',
            );

            expect(result).toEqual([{ closedPnl: '10' }]);
            expect(fetchSpy).toHaveBeenCalledTimes(2);
        });

        it('throws HttpException when Bybit returns an error code', async () => {
            jest.spyOn(service as any, 'fetchBybitData').mockResolvedValue(
                createResponse({ retCode: 1001, retMsg: 'Invalid' }, true, 400),
            );

            await expect(
                service.getTradingPnl(Exchanges.BYBIT, 'api', 'secret', MarketTypes.FUTURES, '0'),
            ).rejects.toBeInstanceOf(HttpException);
        });
    });

    describe('savePnl', () => {
        it('enriches pnl payload with trading account id before persisting', async () => {
            const pnl = [{ closedPnl: '10' } as unknown as FuturesClosedPnl];

            await service.savePnl(pnl, 'account-id');

            expect(repository.saveClosedPnl).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ tradingAccountId: 'account-id', closedPnl: '10' }),
                ]),
            );
        });

        it('throws InternalServerErrorException when persistence fails', async () => {
            repository.saveClosedPnl.mockRejectedValue(new Error('db down'));

            await expect(service.savePnl([], 'account-id')).rejects.toBeInstanceOf(
                InternalServerErrorException,
            );
        });
    });

    describe('validateApiKey', () => {
        it('returns true when Bybit confirms the API key', async () => {
            jest.spyOn(service as any, 'fetchBybitData').mockResolvedValue(
                createResponse({ retCode: 0, result: { userID: '123' } }),
            );

            const result = await service.validateApiKey(Exchanges.BYBIT, 'api', 'secret');

            expect(result).toEqual({ valid: true, exchangeUserAccountId: '123' });
        });

        it('throws HttpException when request fails', async () => {
            jest.spyOn(service as any, 'fetchBybitData').mockResolvedValue({
                ok: false,
                status: 403,
                json: jest.fn().mockResolvedValue({ error: 'denied' }),
            });

            await expect(
                service.validateApiKey(Exchanges.BYBIT, 'api', 'secret'),
            ).rejects.toBeInstanceOf(HttpException);
        });
    });
});

afterAll(() => {
    consoleSpy.mockRestore();
});
