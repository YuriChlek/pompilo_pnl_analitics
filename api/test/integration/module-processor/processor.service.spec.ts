import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EXCHANGES, MARKET_TYPES } from '@/module-api-keys/enums/api-keys-enums';
import { BybitService } from '@/module-bybit/services/bybit.service';
import { ExchangePnlProcessor } from '@/module-processor/processors/exchange-pnl.processor';
import { BybitSyncPnlJobResponse } from '@/module-processor/interfaces/job.interfaces';
import type { Job } from 'bullmq';

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

    beforeEach(async () => {
        getTradingPnlMock = jest
            .fn<
                ReturnType<BybitService['getTradingPnl']>,
                Parameters<BybitService['getTradingPnl']>
            >()
            .mockResolvedValue([{ closedPnl: '1' }]);
        savePnlMock = jest.fn<
            ReturnType<BybitService['savePnl']>,
            Parameters<BybitService['savePnl']>
        >();
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
            '0',
        );
        expect(savePnlMock).toHaveBeenCalledWith([{ closedPnl: '1' }], 'account-id');
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
