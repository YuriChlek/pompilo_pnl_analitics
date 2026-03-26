import { ConfigService } from '@nestjs/config';
import { HttpException, InternalServerErrorException } from '@nestjs/common';
import { BybitService } from '@/module-bybit/services/bybit.service';
import { TradesRepositoryService } from '@/module-trades/services/trades-repository.service';
import { EXCHANGES, MARKET_TYPES } from '@/module-api-keys/enums/api-keys-enums';
import { FuturesClosedPnl } from '@/module-trades/entities/futures-closed-pnl.entity';

const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

type MockFetchResponse = {
    ok: boolean;
    status: number;
    json: jest.Mock<Promise<unknown>, []>;
};

describe('BybitService', () => {
    let service: BybitService;
    let configService: Pick<ConfigService, 'getOrThrow'>;
    let repository: {
        saveClosedPnl: jest.MockedFunction<TradesRepositoryService['saveClosedPnl']>;
    };
    const NOW = 1_700_000_000_000;
    let dateNowSpy: jest.SpiedFunction<typeof Date.now>;

    const createResponse = (data: unknown, ok = true, status = 200): MockFetchResponse => ({
        ok,
        status,
        json: jest.fn<Promise<unknown>, []>().mockResolvedValue(data),
    });

    beforeEach(() => {
        dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(NOW);
        configService = {
            getOrThrow: ((key: string) =>
                key === 'BYBIT_URL'
                    ? 'https://api.bybit.com'
                    : 'https://api-demo.bybit.com') as ConfigService['getOrThrow'],
        };
        repository = {
            saveClosedPnl: jest.fn(),
        };

        service = new BybitService(
            configService as unknown as ConfigService,
            repository as unknown as TradesRepositoryService,
        );
    });

    afterEach(() => {
        dateNowSpy.mockRestore();
    });

    describe('getTradingPnl', () => {
        it('concatenates cursor-paginated responses within the same time window', async () => {
            const fetchSpy = jest
                .spyOn<any, any>(service as any, 'fetchBybitData')
                .mockResolvedValueOnce(
                    createResponse({
                        retCode: 0,
                        retMsg: 'OK',
                        result: {
                            list: [{ closedPnl: '10', updatedTime: String(NOW - 500) }],
                            nextPageCursor: 'cursor-1',
                        },
                    }),
                )
                .mockResolvedValueOnce(
                    createResponse({
                        retCode: 0,
                        retMsg: 'OK',
                        result: {
                            list: [{ closedPnl: '5', updatedTime: String(NOW - 400) }],
                            nextPageCursor: null,
                        },
                    }),
                );

            const result = await service.getTradingPnl(
                EXCHANGES.BYBIT,
                'apiKey',
                'secret',
                MARKET_TYPES.FUTURES,
                String(NOW - 1_000),
            );

            expect(result).toEqual([
                { closedPnl: '10', updatedTime: String(NOW - 500) },
                { closedPnl: '5', updatedTime: String(NOW - 400) },
            ]);
            expect(fetchSpy).toHaveBeenCalledTimes(2);
        });

        it('filters out trades that are not newer than the last synced timestamp', async () => {
            jest.spyOn<any, any>(service as any, 'fetchBybitData').mockResolvedValue(
                createResponse({
                    retCode: 0,
                    retMsg: 'OK',
                    result: {
                        list: [
                            { closedPnl: '10', updatedTime: String(NOW - 1_000) },
                            { closedPnl: '12', updatedTime: String(NOW - 999) },
                        ],
                        nextPageCursor: null,
                    },
                }),
            );

            const result = await service.getTradingPnl(
                EXCHANGES.BYBIT,
                'apiKey',
                'secret',
                MARKET_TYPES.FUTURES,
                String(NOW - 1_000),
            );

            expect(result).toEqual([{ closedPnl: '12', updatedTime: String(NOW - 999) }]);
        });

        it('continues scanning older windows even if one window is empty', async () => {
            jest.spyOn<any, any>(service as any, 'fetchBybitData')
                .mockResolvedValueOnce(
                    createResponse({
                        retCode: 0,
                        retMsg: 'OK',
                        result: {
                            list: [],
                            nextPageCursor: null,
                        },
                    }),
                )
                .mockResolvedValueOnce(
                    createResponse({
                        retCode: 0,
                        retMsg: 'OK',
                        result: {
                            list: [
                                {
                                    closedPnl: '7',
                                    updatedTime: String(NOW - 8 * 24 * 60 * 60 * 1000),
                                },
                            ],
                            nextPageCursor: null,
                        },
                    }),
                );

            const result = await service.getTradingPnl(
                EXCHANGES.BYBIT,
                'apiKey',
                'secret',
                MARKET_TYPES.FUTURES,
                String(NOW - 14 * 24 * 60 * 60 * 1000),
            );

            expect(result).toEqual([
                { closedPnl: '7', updatedTime: String(NOW - 8 * 24 * 60 * 60 * 1000) },
            ]);
        });

        it('throws HttpException when Bybit returns an error code', async () => {
            jest.spyOn(service as any, 'fetchBybitData').mockResolvedValue(
                createResponse({ retCode: 1001, retMsg: 'Invalid' }, true, 400),
            );

            await expect(
                service.getTradingPnl(EXCHANGES.BYBIT, 'api', 'secret', MARKET_TYPES.FUTURES, '0'),
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

            const result = await service.validateApiKey(EXCHANGES.BYBIT, 'api', 'secret');

            expect(result).toEqual({ valid: true, exchangeUserAccountId: '123' });
        });

        it('throws HttpException when request fails', async () => {
            jest.spyOn(service as any, 'fetchBybitData').mockResolvedValue({
                ok: false,
                status: 403,
                json: jest.fn().mockResolvedValue({ error: 'denied' }),
            });

            await expect(
                service.validateApiKey(EXCHANGES.BYBIT, 'api', 'secret'),
            ).rejects.toBeInstanceOf(HttpException);
        });
    });
});

afterAll(() => {
    consoleSpy.mockRestore();
});
