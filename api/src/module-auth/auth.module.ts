import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { UserModule } from '@/module-user/user.module';
import { AuthTokenModule } from '@/module-auth-token/auth-token.module';
import { JwtCustomerAuthStrategy } from '@/module-auth/strategies/jwt-customer-auth.strategy';
import { JwtAdminAuthStrategy } from '@/module-auth/strategies/jwt-admin-auth.strategy';

@Module({
    imports: [UserModule, AuthTokenModule],
    providers: [AuthService, JwtCustomerAuthStrategy, JwtAdminAuthStrategy],
    exports: [AuthService],
})
export class AuthModule {}
