import { Module } from '@nestjs/common';
import { CustomerAuthService } from './services/customer-auth.service';
import { CustomerAuthController } from './customer-auth.controller';
import { AuthModule } from '@/module-auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [CustomerAuthController],
    providers: [CustomerAuthService],
})
export class CustomerAuthModule {}
