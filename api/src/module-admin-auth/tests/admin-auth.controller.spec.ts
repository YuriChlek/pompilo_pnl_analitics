import { Test, TestingModule } from '@nestjs/testing';
import { AdminAuthController } from '@/module-admin-auth/admin-auth.controller';
import { AdminAuthService } from '@/module-admin-auth/services/admin-auth.service';

describe('AdminController', () => {
    let controller: AdminAuthController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AdminAuthController],
            providers: [AdminAuthService],
        }).compile();

        controller = module.get<AdminAuthController>(AdminAuthController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
