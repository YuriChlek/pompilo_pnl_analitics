import { Test, TestingModule } from '@nestjs/testing';
import { TradesService } from '@/module-trades/services/trades.service';
import { TradesRepositoryService } from '@/module-trades/services/trades-repository.service';

describe('TradesService', () => {
    let service: TradesService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TradesService,
                {
                    provide: TradesRepositoryService,
                    useValue: {
                        findClosedPnlStatisticsByTradingAccountId: jest.fn(),
                        findClosedPnlTimelineByTradingAccountId: jest.fn(),
                        findRecentClosedTradesByTradingAccountId: jest.fn(),
                        countClosedTradesByTradingAccountId: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<TradesService>(TradesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
