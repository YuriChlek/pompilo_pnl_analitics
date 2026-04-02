import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from '@/module-user/services/user.service';
import { User } from '@/module-user/entities/user.entity';
import { UserPasswordService } from '@/module-user/services/user-password.service';
import { UserUniquenessService } from '@/module-user/services/user-uniqueness.service';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    providers: [UserService, UserPasswordService, UserUniquenessService],
    exports: [UserService],
})
export class UserModule {}
