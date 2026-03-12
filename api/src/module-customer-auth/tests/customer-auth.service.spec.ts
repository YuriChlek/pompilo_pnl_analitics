import { Test, TestingModule } from '@nestjs/testing';
import { CustomerAuthService } from '../services/customer-auth.service';

describe('CustomerService', () => {
    let service: CustomerAuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [CustomerAuthService],
        }).compile();

        service = module.get<CustomerAuthService>(CustomerAuthService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
