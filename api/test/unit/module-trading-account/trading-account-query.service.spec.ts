import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { TradingAccountQueryService } from '@/module-trading-account/services/trading-account-query.service';
import { TradingAccountBindingRepositoryService } from '@/module-trading-account/services/trading-account-binding.repository.service';
import { AnalyzeService } from '@/module-analyze/services/analyze.service';
import { EXCHANGES, MARKET_TYPES } from '@/module-api-keys/enums/api-keys.enums';
import { TradingAccountAccessService } from '@/module-trading-account/services/trading-account-access.service';
import { TradingAccountViewService } from '@/module-trading-account/services/trading-account-view.service';

describe('TradingAccountQueryService', () => {
    let service: TradingAccountQueryService;
    let tradingAccountBindingRepositoryService: {
        findTradingAccountBindingByTradingAccountId: jest.MockedFunction<
            TradingAccountBindingRepositoryService['findTradingAccountBindingByTradingAccountId']
        >;
    };
    let analyseService: {
        getClosedPnlStatistics: jest.MockedFunction<AnalyzeService['getClosedPnlStatistics']>;
        getClosedPnlTimeline: jest.MockedFunction<AnalyzeService['getClosedPnlTimeline']>;
        getClosedTradePage: jest.MockedFunction<AnalyzeService['getClosedTradePage']>;
    };
    let tradingAccountAccessService: {
        getAuthorizedUserId: jest.MockedFunction<TradingAccountAccessService['getAuthorizedUserId']>;
        getOwnedTradingAccount: jest.MockedFunction<
            TradingAccountAccessService['getOwnedTradingAccount']
        >;
    };
    let tradingAccountViewService: {
        buildTradingAccountSummary: jest.MockedFunction<
            TradingAccountViewService['buildTradingAccountSummary']
        >;
        toApiKeySummary: jest.MockedFunction<TradingAccountViewService['toApiKeySummary']>;
    };

    beforeEach(() => {
        tradingAccountBindingRepositoryService = {
            findTradingAccountBindingByTradingAccountId: jest.fn(),
        };
        analyseService = {
            getClosedPnlStatistics: jest.fn(),
            getClosedPnlTimeline: jest.fn(),
            getClosedTradePage: jest.fn(),
        };
        tradingAccountAccessService = {
            getAuthorizedUserId: jest.fn(),
            getOwnedTradingAccount: jest.fn(),
        };
        tradingAccountViewService = {
            buildTradingAccountSummary: jest.fn(),
            toApiKeySummary: jest.fn(),
        };

        service = new TradingAccountQueryService(
            tradingAccountBindingRepositoryService as unknown as TradingAccountBindingRepositoryService,
            analyseService as unknown as AnalyzeService,
            tradingAccountAccessService as unknown as TradingAccountAccessService,
            tradingAccountViewService as unknown as TradingAccountViewService,
        );
        jest.clearAllMocks();
    });

    it('passes period through details analytics queries', async () => {
        tradingAccountAccessService.getAuthorizedUserId.mockReturnValue('user-id');
        tradingAccountAccessService.getOwnedTradingAccount.mockResolvedValue({
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
        analyseService.getClosedPnlStatistics.mockResolvedValue({
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
        analyseService.getClosedPnlTimeline.mockResolvedValue([]);
        tradingAccountViewService.toApiKeySummary.mockReturnValue({
            id: 'api-key-id',
            apiKeyName: 'Key',
        });
        tradingAccountViewService.buildTradingAccountSummary.mockReturnValue({
            id: 'account-id',
            tradingAccountName: 'Main',
            exchange: EXCHANGES.BYBIT,
            market: MARKET_TYPES.FUTURES,
            apiKeyId: 'api-key-id',
            apiKey: { apiKeyName: 'Key' },
        });

        await service.findOne({} as Request, 'account-id', '90d');

        expect(analyseService.getClosedPnlStatistics).toHaveBeenCalledWith('account-id', '90d');
        expect(analyseService.getClosedPnlTimeline).toHaveBeenCalledWith('account-id', '90d');
    });

    it('passes period through paginated trades query', async () => {
        tradingAccountAccessService.getAuthorizedUserId.mockReturnValue('user-id');
        tradingAccountAccessService.getOwnedTradingAccount.mockResolvedValue({
            id: 'account-id',
            userId: 'user-id',
        } as never);
        analyseService.getClosedTradePage.mockResolvedValue({
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

        expect(analyseService.getClosedTradePage).toHaveBeenCalledWith('account-id', 1, 10, '7d');
    });

    it('rejects access when account does not belong to authenticated user', async () => {
        tradingAccountAccessService.getAuthorizedUserId.mockReturnValue('user-id');
        tradingAccountAccessService.getOwnedTradingAccount.mockRejectedValue(
            new UnauthorizedException(),
        );

        await expect(service.findOne({} as Request, 'account-id', 'all')).rejects.toBeInstanceOf(
            UnauthorizedException,
        );
    });

    it('throws not found for missing trading account', async () => {
        tradingAccountAccessService.getAuthorizedUserId.mockReturnValue('user-id');
        tradingAccountAccessService.getOwnedTradingAccount.mockRejectedValue(
            new NotFoundException(),
        );

        await expect(
            service.findTrades({} as Request, 'missing-account', { period: 'all' }),
        ).rejects.toBeInstanceOf(NotFoundException);
    });
});
