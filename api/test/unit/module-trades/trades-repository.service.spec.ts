import { TradesRepositoryService } from '@/module-trades/services/trades-repository.service';
import { FuturesClosedPnl } from '@/module-trades/entities/futures-closed-pnl.entity';
import { createMockRepository } from '../../utils/mock-factories';

const createQueryBuilderMock = () => {
    const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
        getRawMany: jest.fn(),
        getMany: jest.fn(),
        getCount: jest.fn(),
    };

    return queryBuilder;
};

describe('TradesRepositoryService', () => {
    it('applies fromTimestamp filter to statistics query', async () => {
        const queryBuilder = createQueryBuilderMock();
        queryBuilder.getRawOne.mockResolvedValue(null);
        const repository = createMockRepository<FuturesClosedPnl>(['createQueryBuilder']);
        repository.createQueryBuilder.mockReturnValue(queryBuilder as never);
        const service = new TradesRepositoryService(repository);

        await service.findClosedPnlStatisticsByTradingAccountId('account-id', '1000');

        expect(queryBuilder.where).toHaveBeenCalledWith(
            'trade.tradingAccountId = :tradingAccountId',
            { tradingAccountId: 'account-id' },
        );
        expect(queryBuilder.andWhere).toHaveBeenCalledWith('trade.createdTime >= :fromTimestamp', {
            fromTimestamp: '1000',
        });
    });

    it('does not apply fromTimestamp filter when it is not provided', async () => {
        const queryBuilder = createQueryBuilderMock();
        queryBuilder.getCount.mockResolvedValue(0);
        const repository = createMockRepository<FuturesClosedPnl>(['createQueryBuilder']);
        repository.createQueryBuilder.mockReturnValue(queryBuilder as never);
        const service = new TradesRepositoryService(repository);

        await service.countClosedTradesByTradingAccountId('account-id');

        expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('applies fromTimestamp filter to timeline query', async () => {
        const queryBuilder = createQueryBuilderMock();
        queryBuilder.getRawMany.mockResolvedValue([]);
        const repository = createMockRepository<FuturesClosedPnl>(['createQueryBuilder']);
        repository.createQueryBuilder.mockReturnValue(queryBuilder as never);
        const service = new TradesRepositoryService(repository);

        await service.findClosedPnlTimelineByTradingAccountId('account-id', '2000');

        expect(queryBuilder.andWhere).toHaveBeenCalledWith('trade.createdTime >= :fromTimestamp', {
            fromTimestamp: '2000',
        });
    });

    it('applies fromTimestamp filter to paginated trades query', async () => {
        const queryBuilder = createQueryBuilderMock();
        queryBuilder.getMany.mockResolvedValue([]);
        const repository = createMockRepository<FuturesClosedPnl>(['createQueryBuilder']);
        repository.createQueryBuilder.mockReturnValue(queryBuilder as never);
        const service = new TradesRepositoryService(repository);

        await service.findRecentClosedTradesByTradingAccountId('account-id', 2, 25, '3000');

        expect(queryBuilder.skip).toHaveBeenCalledWith(25);
        expect(queryBuilder.take).toHaveBeenCalledWith(25);
        expect(queryBuilder.andWhere).toHaveBeenCalledWith('trade.createdTime >= :fromTimestamp', {
            fromTimestamp: '3000',
        });
    });

    it('applies fromTimestamp filter to count query', async () => {
        const queryBuilder = createQueryBuilderMock();
        queryBuilder.getCount.mockResolvedValue(1);
        const repository = createMockRepository<FuturesClosedPnl>(['createQueryBuilder']);
        repository.createQueryBuilder.mockReturnValue(queryBuilder as never);
        const service = new TradesRepositoryService(repository);

        await service.countClosedTradesByTradingAccountId('account-id', '4000');

        expect(queryBuilder.andWhere).toHaveBeenCalledWith('trade.createdTime >= :fromTimestamp', {
            fromTimestamp: '4000',
        });
    });
});
