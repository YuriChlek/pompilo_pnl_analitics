import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { BybitService } from '@/module-bybit/services/bybit.service';
import { TradesRepositoryService } from '@/module-trades/services/trades-repository.service';
import { Exchanges, MarketTypes } from '@/module-api-keys/enums';
import { FuturesClosedPnl } from '@/module-trades/entities/futures-closed-pnl.entity';

const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

describe('BybitService', () => {
    let service: BybitService;
    let configService: jest.Mocked<ConfigService>;
    let repository: jest.Mocked<TradesRepositoryService>;

    const createResponse = (data: unknown, ok = true, status = 200) =>
        ({
            ok,
            status,
            json: jest.fn().mockResolvedValue(data),
        }) as any;

    beforeEach(() => {
        configService = {
            getOrThrow: jest.fn((key: string) =>
                key === 'BYBIT_URL' ? 'https://api.bybit.com' : 'https://api-demo.bybit.com',
            ),
        } as unknown as jest.Mocked<ConfigService>;
        repository = {
            saveClosedPnl: jest.fn(),
        } as unknown as jest.Mocked<TradesRepositoryService>;

        service = new BybitService(configService, repository);
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
