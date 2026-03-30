import { Test, TestingModule } from '@nestjs/testing';
import { TradesService } from '@/module-trades/services/trades.service';
import { TradesRepositoryService } from '@/module-trades/services/trades-repository.service';
import { DEFAULT_ANALYTICS_PERIOD } from '@/module-trades/constants/analytics-periods';

describe('TradesService', () => {
    let service: TradesService;
    let repository: {
        findClosedPnlStatisticsByTradingAccountId: jest.Mock;
        findClosedPnlTimelineByTradingAccountId: jest.Mock;
        findRecentClosedTradesByTradingAccountId: jest.Mock;
        countClosedTradesByTradingAccountId: jest.Mock;
    };

    beforeEach(async () => {
        repository = {
            findClosedPnlStatisticsByTradingAccountId: jest.fn().mockResolvedValue({
                totalTrades: '0',
                winningTrades: '0',
                losingTrades: '0',
                totalClosedPnl: '0',
                grossProfit: '0',
                grossLoss: '0',
                averageClosedPnl: '0',
                bestTrade: null,
                worstTrade: null,
                latestTradeAt: null,
            }),
            findClosedPnlTimelineByTradingAccountId: jest.fn().mockResolvedValue([]),
            findRecentClosedTradesByTradingAccountId: jest.fn().mockResolvedValue([]),
            countClosedTradesByTradingAccountId: jest.fn().mockResolvedValue(0),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TradesService,
                {
                    provide: TradesRepositoryService,
                    useValue: repository,
                },
            ],
        }).compile();

        service = module.get<TradesService>(TradesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('uses all-period semantics by default for statistics', async () => {
        await service.getClosedPnlStatistics('account-id');

        expect(repository.findClosedPnlStatisticsByTradingAccountId).toHaveBeenCalledWith(
            'account-id',
            null,
        );
    });

    it.each([
        ['7d', 7],
        ['30d', 30],
        ['90d', 90],
        ['180d', 180],
    ] as const)(
        'maps %s period to lower timestamp bound for all analytics queries',
        async (period, days) => {
            const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(2_000_000_000_000);

            await service.getClosedPnlStatistics('account-id', period);
            await service.getClosedPnlTimeline('account-id', period);
            await service.getClosedTradePage('account-id', 1, 10, period);

            const expected = String(2_000_000_000_000 - days * 24 * 60 * 60 * 1000);

            expect(repository.findClosedPnlStatisticsByTradingAccountId).toHaveBeenLastCalledWith(
                'account-id',
                expected,
            );
            expect(repository.findClosedPnlTimelineByTradingAccountId).toHaveBeenLastCalledWith(
                'account-id',
                expected,
            );
            expect(repository.countClosedTradesByTradingAccountId).toHaveBeenLastCalledWith(
                'account-id',
                expected,
            );
            expect(repository.findRecentClosedTradesByTradingAccountId).toHaveBeenLastCalledWith(
                'account-id',
                1,
                10,
                expected,
            );

            nowSpy.mockRestore();
        },
    );

    it('passes null filter for explicit all period in paginated trades', async () => {
        await service.getClosedTradePage('account-id', 2, 25, DEFAULT_ANALYTICS_PERIOD);

        expect(repository.countClosedTradesByTradingAccountId).toHaveBeenCalledWith(
            'account-id',
            null,
        );
        expect(repository.findRecentClosedTradesByTradingAccountId).toHaveBeenCalledWith(
            'account-id',
            1,
            25,
            null,
        );
    });
});
