import { Test, TestingModule } from '@nestjs/testing';
import { TradingAccountController } from '../trading-account.controller';
import { TradingAccountService } from '../services/trading-account.service';

describe('TradingAccountController', () => {
    let controller: TradingAccountController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TradingAccountController],
            providers: [TradingAccountService],
        }).compile();

        controller = module.get<TradingAccountController>(TradingAccountController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
