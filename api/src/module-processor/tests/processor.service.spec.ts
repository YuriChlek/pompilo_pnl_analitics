import { Test, TestingModule } from '@nestjs/testing';
import { ExchangePnlProcessor } from '../processor-services/exchange-pnl.processor';

describe('ProcessorService', () => {
    let service: ExchangePnlProcessor;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ExchangePnlProcessor],
        }).compile();

        service = module.get<ExchangePnlProcessor>(ExchangePnlProcessor);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
