import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { TradingAccountQueryService } from '@/module-trading-account/services/trading-account-query.service';
import { TokenService } from '@/module-auth-token/services/token.service';
import { getUserIdFromToken } from '@/common/utils/get-user-id-from-tocken';
import { TradingAccountRepositoryService } from '@/module-trading-account/services/trading-account-repository.service';
import { TradingAccountBindingRepositoryService } from '@/module-trading-account/services/trading-account-binding.repository.service';
import { TradesService } from '@/module-trades/services/trades.service';
import { EXCHANGES, MARKET_TYPES } from '@/module-api-keys/enums/api-keys-enums';

jest.mock('@/common/utils/get-user-id-from-tocken', () => ({
    getUserIdFromToken: jest.fn(),
}));

describe('TradingAccountQueryService', () => {
    let service: TradingAccountQueryService;
    let tradingAccountRepositoryService: {
        findTradingAccountById: jest.MockedFunction<
            TradingAccountRepositoryService['findTradingAccountById']
        >;
    };
    let tradingAccountBindingRepositoryService: {
        findTradingAccountBindingByTradingAccountId: jest.MockedFunction<
            TradingAccountBindingRepositoryService['findTradingAccountBindingByTradingAccountId']
        >;
    };
    let tradesService: {
        getClosedPnlStatistics: jest.MockedFunction<TradesService['getClosedPnlStatistics']>;
        getClosedPnlTimeline: jest.MockedFunction<TradesService['getClosedPnlTimeline']>;
        getClosedTradePage: jest.MockedFunction<TradesService['getClosedTradePage']>;
    };

    beforeEach(() => {
        tradingAccountRepositoryService = {
            findTradingAccountById: jest.fn(),
        };
        tradingAccountBindingRepositoryService = {
            findTradingAccountBindingByTradingAccountId: jest.fn(),
        };
        tradesService = {
            getClosedPnlStatistics: jest.fn(),
            getClosedPnlTimeline: jest.fn(),
            getClosedTradePage: jest.fn(),
        };

        service = new TradingAccountQueryService(
            {} as TokenService,
            tradingAccountRepositoryService as unknown as TradingAccountRepositoryService,
            tradingAccountBindingRepositoryService as unknown as TradingAccountBindingRepositoryService,
            tradesService as unknown as TradesService,
        );
        jest.clearAllMocks();
    });

    it('passes period through details analytics queries', async () => {
        (getUserIdFromToken as jest.Mock).mockReturnValue('user-id');
        tradingAccountRepositoryService.findTradingAccountById.mockResolvedValue({
            id: 'account-id',
            userId: 'user-id',
            tradingAccountName: 'Main',
            exchange: EXCHANGES.BYBIT,
            market: MARKET_TYPES.FUTURES,
        } as never);
        tradingAccountBindingRepositoryService.findTradingAccountBindingByTradingAccountId.mockResolvedValue(
            {
                apiKey: {
                    id: 'api-key-id',
                    apiKeyName: 'Key',
                },
            } as never,
        );
        tradesService.getClosedPnlStatistics.mockResolvedValue({
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            winRate: 0,
            totalClosedPnl: 0,
            grossProfit: 0,
            grossLoss: 0,
            averageClosedPnl: 0,
            bestTrade: null,
            worstTrade: null,
            profitFactor: null,
            latestTradeAt: null,
        });
        tradesService.getClosedPnlTimeline.mockResolvedValue([]);

        await service.findOne({} as Request, 'account-id', '90d');

        expect(tradesService.getClosedPnlStatistics).toHaveBeenCalledWith('account-id', '90d');
        expect(tradesService.getClosedPnlTimeline).toHaveBeenCalledWith('account-id', '90d');
    });

    it('passes period through paginated trades query', async () => {
        (getUserIdFromToken as jest.Mock).mockReturnValue('user-id');
        tradingAccountRepositoryService.findTradingAccountById.mockResolvedValue({
            id: 'account-id',
            userId: 'user-id',
        } as never);
        tradesService.getClosedTradePage.mockResolvedValue({
            items: [],
            page: 1,
            pageSize: 10,
            totalItems: 0,
            totalPages: 1,
        });

        await service.findTrades({} as Request, 'account-id', {
            period: '7d',
            page: 1,
            pageSize: 10,
        });

        expect(tradesService.getClosedTradePage).toHaveBeenCalledWith('account-id', 1, 10, '7d');
    });

    it('rejects access when account does not belong to authenticated user', async () => {
        (getUserIdFromToken as jest.Mock).mockReturnValue('user-id');
        tradingAccountRepositoryService.findTradingAccountById.mockResolvedValue({
            id: 'account-id',
            userId: 'other-user-id',
        } as never);

        await expect(service.findOne({} as Request, 'account-id', 'all')).rejects.toBeInstanceOf(
            UnauthorizedException,
        );
    });

    it('throws not found for missing trading account', async () => {
        (getUserIdFromToken as jest.Mock).mockReturnValue('user-id');
        tradingAccountRepositoryService.findTradingAccountById.mockResolvedValue(null);

        await expect(
            service.findTrades({} as Request, 'missing-account', { period: 'all' }),
        ).rejects.toBeInstanceOf(NotFoundException);
    });
});
