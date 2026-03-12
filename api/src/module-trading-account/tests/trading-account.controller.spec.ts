import type { Request } from 'express';
import { TradingAccountController } from '@/module-trading-account/trading-account.controller';
import { TradingAccountService } from '@/module-trading-account/services/trading-account.service';
import { CreateTradingAccountDto } from '@/module-trading-account/dto/create-trading-account.dto';
import { UpdateTradingAccountDto } from '@/module-trading-account/dto/update-trading-account.dto';

describe('TradingAccountController', () => {
    let controller: TradingAccountController;
    let service: jest.Mocked<TradingAccountService>;

    beforeEach(() => {
        service = {
            create: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
        } as unknown as jest.Mocked<TradingAccountService>;
        controller = new TradingAccountController(service);
        jest.clearAllMocks();
    });

    it('delegates create to the service', async () => {
        const dto = { tradingAccountName: 'Test' } as CreateTradingAccountDto;
        service.create.mockResolvedValue({ id: 'acc' } as never);

        const result = await controller.create(dto);

        expect(result).toEqual({ id: 'acc' });
        expect(service.create).toHaveBeenCalledWith(dto);
    });

    it('delegates findAll with request context', async () => {
        const req = {} as Request;
        service.findAll.mockResolvedValue([] as never);

        await controller.findAll(req);

        expect(service.findAll).toHaveBeenCalledWith(req);
    });

    it('passes identifiers to update/remove', () => {
        controller.update('8', {} as UpdateTradingAccountDto);
        expect(service.update).toHaveBeenCalledWith(8, expect.any(Object));

        controller.remove('12');
        expect(service.remove).toHaveBeenCalledWith(12);
    });
});
