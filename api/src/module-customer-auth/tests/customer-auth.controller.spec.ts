import { Test, TestingModule } from '@nestjs/testing';
import { CustomerAuthController } from '../customer-auth.controller';
import { CustomerAuthService } from '../services/customer-auth.service';

describe('CustomerController', () => {
    let controller: CustomerAuthController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CustomerAuthController],
            providers: [CustomerAuthService],
        }).compile();

        controller = module.get<CustomerAuthController>(CustomerAuthController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
