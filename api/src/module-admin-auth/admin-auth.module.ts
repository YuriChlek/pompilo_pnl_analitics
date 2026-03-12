import { Module } from '@nestjs/common';
import { AdminAuthService } from './services/admin-auth.service';
import { AdminAuthController } from './admin-auth.controller';
import { AuthModule } from '@/module-auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [AdminAuthController],
    providers: [AdminAuthService],
})
export class AdminAuthModule {}
