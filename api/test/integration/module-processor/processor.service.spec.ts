import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EXCHANGES, MARKET_TYPES } from '@/module-api-keys/enums/api-keys.enums';
import { BybitService } from '@/module-bybit/services/bybit.service';
import { ExchangePnlProcessor } from '@/module-processor/processors/exchange-pnl.processor';
import { BybitSyncPnlJobResponse } from '@/module-processor/interfaces/job.interfaces';
import type { Job } from 'bullmq';
import { TradesRepositoryService } from '@/module-trades/services/trades-repository.service';
import { FuturesClosedPnl } from '@/module-trades/entities/futures-closed-pnl.entity';

const createJob = (data: Partial<BybitSyncPnlJobResponse>): BybitSyncPnlJobResponse => ({
    tradingAccountId: 'account-id',
    apiKey: 'api',
    secretKey: 'secret',
    market: MARKET_TYPES.FUTURES,
    exchange: EXCHANGES.BYBIT,
    ...data,
});

const wrapAsJob = (data: BybitSyncPnlJobResponse): Job<BybitSyncPnlJobResponse> =>
    ({ data }) as unknown as Job<BybitSyncPnlJobResponse>;

describe('ExchangePnlProcessor', () => {
    let processor: ExchangePnlProcessor;
    let getTradingPnlMock: jest.MockedFunction<BybitService['getTradingPnl']>;
    let savePnlMock: jest.MockedFunction<BybitService['savePnl']>;
    let findLatestUpdatedTimeMock: jest.MockedFunction<
        TradesRepositoryService['findLatestUpdatedTime']
    >;

    beforeEach(async () => {
        getTradingPnlMock = jest
            .fn<
                ReturnType<BybitService['getTradingPnl']>,
                Parameters<BybitService['getTradingPnl']>
            >()
            .mockResolvedValue([{ closedPnl: '1' } as unknown as FuturesClosedPnl]);
        savePnlMock = jest.fn<
            ReturnType<BybitService['savePnl']>,
            Parameters<BybitService['savePnl']>
        >();
        findLatestUpdatedTimeMock = jest
            .fn<
                ReturnType<TradesRepositoryService['findLatestUpdatedTime']>,
                Parameters<TradesRepositoryService['findLatestUpdatedTime']>
            >()
            .mockResolvedValue('123');
        const moduleRef: TestingModule = await Test.createTestingModule({
            providers: [
                ExchangePnlProcessor,
                {
                    provide: BybitService,
                    useValue: {
                        getTradingPnl: getTradingPnlMock,
                        savePnl: savePnlMock,
                    },
                },
                {
                    provide: TradesRepositoryService,
                    useValue: {
                        findLatestUpdatedTime: findLatestUpdatedTimeMock,
                    },
                },
            ],
        }).compile();

        processor = moduleRef.get(ExchangePnlProcessor);
    });

    it('fetches pnl from Bybit and persists it', async () => {
        const job = wrapAsJob(createJob({ market: MARKET_TYPES.FUTURES }));

        await processor.process(job);

        expect(getTradingPnlMock).toHaveBeenCalledWith(
            EXCHANGES.BYBIT,
            'api',
            'secret',
            MARKET_TYPES.FUTURES,
            '123',
        );
        expect(savePnlMock).toHaveBeenCalledWith(
            [{ closedPnl: '1' } as unknown as FuturesClosedPnl],
            'account-id',
        );
    });

    it('rethrows errors raised during processing', async () => {
        getTradingPnlMock.mockRejectedValue(new Error('network'));

        await expect(processor.process(wrapAsJob(createJob({})))).rejects.toThrow('network');
    });

    it('wraps non-error values into InternalServerErrorException', async () => {
        getTradingPnlMock.mockRejectedValue('failure');

        await expect(processor.process(wrapAsJob(createJob({})))).rejects.toBeInstanceOf(
            InternalServerErrorException,
        );
    });
});
