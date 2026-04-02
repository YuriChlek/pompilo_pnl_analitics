import { HttpException, InternalServerErrorException } from '@nestjs/common';
import { BybitService } from '@/module-bybit/services/bybit.service';
import { BybitApiService } from '@/module-bybit/services/bybit-api.service';
import { TradesRepositoryService } from '@/module-trades/services/trades-repository.service';
import { EXCHANGES, MARKET_TYPES } from '@/module-api-keys/enums/api-keys.enums';
import { FuturesClosedPnl } from '@/module-trades/entities/futures-closed-pnl.entity';

const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

describe('BybitService', () => {
    let service: BybitService;
    let bybitApiService: {
        getClosedPnlPage: jest.MockedFunction<BybitApiService['getClosedPnlPage']>;
        queryApiKey: jest.MockedFunction<BybitApiService['queryApiKey']>;
    };
    let repository: {
        saveClosedPnl: jest.MockedFunction<TradesRepositoryService['saveClosedPnl']>;
    };
    const NOW = 1_700_000_000_000;
    let dateNowSpy: jest.SpiedFunction<typeof Date.now>;

    beforeEach(() => {
        dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(NOW);
        bybitApiService = {
            getClosedPnlPage: jest.fn(),
            queryApiKey: jest.fn(),
        };
        repository = {
            saveClosedPnl: jest.fn(),
        };

        service = new BybitService(
            bybitApiService as unknown as BybitApiService,
            repository as unknown as TradesRepositoryService,
        );
    });

    afterEach(() => {
        dateNowSpy.mockRestore();
    });

    describe('getTradingPnl', () => {
        it('concatenates cursor-paginated responses within the same time window', async () => {
            bybitApiService.getClosedPnlPage
                .mockResolvedValueOnce({
                    retCode: 0,
                    retMsg: 'OK',
                    result: {
                        list: [{ closedPnl: '10', updatedTime: String(NOW - 500) }],
                        nextPageCursor: 'cursor-1',
                        category: MARKET_TYPES.FUTURES,
                    },
                    retExtInfo: {},
                    time: NOW,
                })
                .mockResolvedValueOnce({
                    retCode: 0,
                    retMsg: 'OK',
                    result: {
                        list: [{ closedPnl: '5', updatedTime: String(NOW - 400) }],
                        nextPageCursor: null,
                        category: MARKET_TYPES.FUTURES,
                    },
                    retExtInfo: {},
                    time: NOW,
                })
                .mockResolvedValueOnce({
                    retCode: 0,
                    retMsg: 'OK',
                    result: {
                        list: [],
                        nextPageCursor: null,
                        category: MARKET_TYPES.FUTURES,
                    },
                    retExtInfo: {},
                    time: NOW,
                });

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
            expect(bybitApiService.getClosedPnlPage).toHaveBeenCalledTimes(3);
        });

        it('stops scanning when the current window returns no trades', async () => {
            bybitApiService.getClosedPnlPage.mockResolvedValue({
                    retCode: 0,
                    retMsg: 'OK',
                    result: {
                        list: [],
                        nextPageCursor: null,
                        category: MARKET_TYPES.FUTURES,
                    },
                    retExtInfo: {},
                    time: NOW,
                });

            const result = await service.getTradingPnl(
                EXCHANGES.BYBIT,
                'apiKey',
                'secret',
                MARKET_TYPES.FUTURES,
                String(NOW - 1_000),
            );

            expect(result).toEqual([]);
            expect(bybitApiService.getClosedPnlPage).toHaveBeenCalledTimes(1);
        });

        it('continues scanning older windows while trades are returned', async () => {
            bybitApiService.getClosedPnlPage
                .mockResolvedValueOnce(
                    {
                        retCode: 0,
                        retMsg: 'OK',
                        result: {
                            list: [
                                {
                                    closedPnl: '9',
                                    updatedTime: String(NOW - 1_000),
                                },
                            ],
                            nextPageCursor: null,
                            category: MARKET_TYPES.FUTURES,
                        },
                        retExtInfo: {},
                        time: NOW,
                    },
                )
                .mockResolvedValueOnce(
                    {
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
                            category: MARKET_TYPES.FUTURES,
                        },
                        retExtInfo: {},
                        time: NOW,
                    },
                )
                .mockResolvedValueOnce(
                    {
                        retCode: 0,
                        retMsg: 'OK',
                        result: {
                            list: [],
                            nextPageCursor: null,
                            category: MARKET_TYPES.FUTURES,
                        },
                        retExtInfo: {},
                        time: NOW,
                    },
                );

            const result = await service.getTradingPnl(
                EXCHANGES.BYBIT,
                'apiKey',
                'secret',
                MARKET_TYPES.FUTURES,
                String(NOW - 14 * 24 * 60 * 60 * 1000),
            );

            expect(result).toEqual([
                { closedPnl: '9', updatedTime: String(NOW - 1_000) },
                { closedPnl: '7', updatedTime: String(NOW - 8 * 24 * 60 * 60 * 1000) },
            ]);
        });

        it('throws HttpException when Bybit returns an error code', async () => {
            bybitApiService.getClosedPnlPage.mockResolvedValue({
                retCode: 1001,
                retMsg: 'Invalid',
                result: {
                    list: [],
                    nextPageCursor: null,
                    category: MARKET_TYPES.FUTURES,
                },
                retExtInfo: {},
                time: NOW,
            });

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
            bybitApiService.queryApiKey.mockResolvedValue({
                retCode: 0,
                retMsg: 'OK',
                result: { userID: '123' } as any,
                retExtInfo: {},
                time: NOW,
            });

            const result = await service.validateApiKey(EXCHANGES.BYBIT, 'api', 'secret');

            expect(result).toEqual({ valid: true, exchangeUserAccountId: '123' });
        });

        it('throws HttpException when request fails', async () => {
            bybitApiService.queryApiKey.mockRejectedValue(new HttpException('denied', 403));

            await expect(
                service.validateApiKey(EXCHANGES.BYBIT, 'api', 'secret'),
            ).rejects.toBeInstanceOf(HttpException);
        });
    });
});

afterAll(() => {
    consoleSpy.mockRestore();
});
