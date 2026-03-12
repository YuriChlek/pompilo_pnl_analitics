import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from '@/module-user/services/user.service';
import { User } from '@/module-user/entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule {}
