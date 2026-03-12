import { Test, TestingModule } from '@nestjs/testing';
import { AdminAuthService } from '../services/admin-auth.service';

describe('AdminService', () => {
    let service: AdminAuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AdminAuthService],
        }).compile();

        service = module.get<AdminAuthService>(AdminAuthService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
