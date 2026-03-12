import { Exchanges, MarketTypes } from '@/module-api-keys/enums';
import { BybitService } from '@/module-bybit/services/bybit.service';
import { ExchangePnlProcessor } from '@/module-processor/processors/exchange-pnl.processor';
import { BybitSyncPnlJobResponse } from '@/module-processor/interfaces/job.interfaces';

const createJob = (data: Partial<BybitSyncPnlJobResponse>): BybitSyncPnlJobResponse =>
    ({
        tradingAccountId: 'account-id',
        apiKey: 'api',
        secretKey: 'secret',
        market: MarketTypes.FUTURES,
        exchange: Exchanges.BYBIT,
        ...data,
    }) as BybitSyncPnlJobResponse;

describe('ExchangePnlProcessor', () => {
    let processor: ExchangePnlProcessor;
    let bybitService: jest.Mocked<BybitService>;

    beforeEach(() => {
        bybitService = {
            getTradingPnl: jest.fn().mockResolvedValue([{ closedPnl: '1' }] as never),
            savePnl: jest.fn(),
        } as unknown as jest.Mocked<BybitService>;

        processor = new ExchangePnlProcessor(bybitService);
    });

    it('fetches pnl from Bybit and persists it', async () => {
        const job = { data: createJob({ market: MarketTypes.FUTURES }) } as any;

        await processor.process(job);

        expect(bybitService.getTradingPnl).toHaveBeenCalledWith(
            Exchanges.BYBIT,
            'api',
            'secret',
            MarketTypes.FUTURES,
            '0',
        );
        expect(bybitService.savePnl).toHaveBeenCalledWith([{ closedPnl: '1' }], 'account-id');
    });

    it('rethrows errors raised during processing', async () => {
        bybitService.getTradingPnl.mockRejectedValue(new Error('network'));

        await expect(processor.process({ data: createJob({}) } as any)).rejects.toThrow('network');
    });
});
