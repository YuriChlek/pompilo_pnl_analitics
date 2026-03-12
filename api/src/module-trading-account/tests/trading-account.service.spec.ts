import { Test, TestingModule } from '@nestjs/testing';
import { TradingAccountService } from '../services/trading-account.service';

describe('TradingAccountService', () => {
    let service: TradingAccountService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [TradingAccountService],
        }).compile();

        service = module.get<TradingAccountService>(TradingAccountService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
