import type { Request } from 'express';
import { TradingAccountController } from '@/module-trading-account/trading-account.controller';
import { TradingAccountService } from '@/module-trading-account/services/trading-account.service';
import { TradingAccountQueryService } from '@/module-trading-account/services/trading-account-query.service';
import { CreateTradingAccountDto } from '@/module-trading-account/dto/create-trading-account.dto';
import { UpdateTradingAccountDto } from '@/module-trading-account/dto/update-trading-account.dto';
import { EXCHANGES, MARKET_TYPES } from '@/module-api-keys/enums/api-keys-enums';
import { TradingAccountTradesQueryDto } from '@/module-trading-account/dto/trading-account-trades-query.dto';
import { TradingAccountAnalyticsQueryDto } from '@/module-trading-account/dto/trading-account-analytics-query.dto';

type AwaitedReturn<T> = T extends Promise<infer R> ? R : T;

describe('TradingAccountController', () => {
    let controller: TradingAccountController;
    let service: jest.Mocked<TradingAccountService>;
    let queryService: jest.Mocked<TradingAccountQueryService>;
    let createMock: jest.MockedFunction<TradingAccountService['create']>;
    let findAllMock: jest.MockedFunction<TradingAccountService['findAll']>;
    let updateMock: jest.MockedFunction<TradingAccountService['update']>;
    let removeMock: jest.MockedFunction<TradingAccountService['remove']>;
    let findOneMock: jest.MockedFunction<TradingAccountQueryService['findOne']>;
    let findTradesMock: jest.MockedFunction<TradingAccountQueryService['findTrades']>;

    beforeEach(() => {
        createMock = jest.fn();
        findAllMock = jest.fn();
        updateMock = jest.fn();
        removeMock = jest.fn();
        findOneMock = jest.fn();
        findTradesMock = jest.fn();
        service = {
            create: createMock,
            findAll: findAllMock,
            update: updateMock,
            remove: removeMock,
        } as jest.Mocked<TradingAccountService>;
        queryService = {
            findOne: findOneMock,
            findTrades: findTradesMock,
        } as jest.Mocked<TradingAccountQueryService>;
        controller = new TradingAccountController(service, queryService);
        jest.clearAllMocks();
    });

    it('delegates create to the service', async () => {
        const req = {} as Request;
        const dto: CreateTradingAccountDto = {
            tradingAccountName: 'Test',
            apiKeyId: 'api-key',
            exchange: EXCHANGES.BYBIT,
            market: MARKET_TYPES.FUTURES,
        };
        createMock.mockResolvedValue({ id: 'acc' } as AwaitedReturn<
            ReturnType<TradingAccountService['create']>
        >);

        const result = await controller.create(req, dto);

        expect(result).toEqual({ id: 'acc' });
        expect(createMock).toHaveBeenCalledWith(req, dto);
    });

    it('delegates findAll with request context', async () => {
        const req = {} as Request;
        findAllMock.mockResolvedValue(
            [] as AwaitedReturn<ReturnType<TradingAccountService['findAll']>>,
        );

        await controller.findAll(req);

        expect(findAllMock).toHaveBeenCalledWith(req);
    });

    it('passes request context and identifiers to update/remove', () => {
        const req = {} as Request;

        controller.update(req, '8', {
            tradingAccountName: 'Updated',
        } satisfies UpdateTradingAccountDto);
        expect(updateMock).toHaveBeenCalledWith(req, '8', expect.any(Object));

        controller.remove(req, '12');
        expect(removeMock).toHaveBeenCalledWith(req, '12');
    });

    it('delegates account details query with analytics period', async () => {
        const req = {} as Request;
        const query: TradingAccountAnalyticsQueryDto = { period: '30d' };

        await controller.findOne(req, 'account-id', query);

        expect(findOneMock).toHaveBeenCalledWith(req, 'account-id', '30d');
    });

    it('delegates trades query with pagination and analytics period', async () => {
        const req = {} as Request;
        const query: TradingAccountTradesQueryDto = {
            period: '7d',
            page: 2,
            pageSize: 25,
        };

        await controller.findTrades(req, 'account-id', query);

        expect(findTradesMock).toHaveBeenCalledWith(req, 'account-id', query);
    });
});
