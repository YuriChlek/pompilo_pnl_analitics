import type { Request } from 'express';
import { TradingAccountController } from '@/module-trading-account/trading-account.controller';
import { TradingAccountService } from '@/module-trading-account/services/trading-account.service';
import { CreateTradingAccountDto } from '@/module-trading-account/dto/create-trading-account.dto';
import { UpdateTradingAccountDto } from '@/module-trading-account/dto/update-trading-account.dto';
import { Exchanges, MarketTypes } from '@/module-api-keys/enums';

type AwaitedReturn<T> = T extends Promise<infer R> ? R : T;

describe('TradingAccountController', () => {
    let controller: TradingAccountController;
    let service: jest.Mocked<TradingAccountService>;
    let createMock: jest.MockedFunction<TradingAccountService['create']>;
    let findAllMock: jest.MockedFunction<TradingAccountService['findAll']>;
    let updateMock: jest.MockedFunction<TradingAccountService['update']>;
    let removeMock: jest.MockedFunction<TradingAccountService['remove']>;

    beforeEach(() => {
        createMock = jest.fn();
        findAllMock = jest.fn();
        updateMock = jest.fn();
        removeMock = jest.fn();
        service = {
            create: createMock,
            findAll: findAllMock,
            update: updateMock,
            remove: removeMock,
        } as jest.Mocked<TradingAccountService>;
        controller = new TradingAccountController(service);
        jest.clearAllMocks();
    });

    it('delegates create to the service', async () => {
        const dto: CreateTradingAccountDto = {
            tradingAccountName: 'Test',
            apiKeyId: 'api-key',
            exchange: Exchanges.BYBIT,
            market: MarketTypes.FUTURES,
        };
        createMock.mockResolvedValue({ id: 'acc' } as AwaitedReturn<
            ReturnType<TradingAccountService['create']>
        >);

        const result = await controller.create(dto);

        expect(result).toEqual({ id: 'acc' });
        expect(createMock).toHaveBeenCalledWith(dto);
    });

    it('delegates findAll with request context', async () => {
        const req = {} as Request;
        findAllMock.mockResolvedValue(
            [] as AwaitedReturn<ReturnType<TradingAccountService['findAll']>>,
        );

        await controller.findAll(req);

        expect(findAllMock).toHaveBeenCalledWith(req);
    });

    it('passes identifiers to update/remove', () => {
        controller.update('8', {
            tradingAccountName: 'Updated',
        } satisfies UpdateTradingAccountDto);
        expect(updateMock).toHaveBeenCalledWith(8, expect.any(Object));

        controller.remove('12');
        expect(removeMock).toHaveBeenCalledWith(12);
    });
});
