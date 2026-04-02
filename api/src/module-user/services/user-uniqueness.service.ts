import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/module-user/entities/user.entity';

@Injectable()
export class UserUniquenessService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async ensureUnique(email: string, name: string, excludeId?: string): Promise<void> {
        const query = this.userRepository
            .createQueryBuilder('user')
            .where('user.email = :email OR user.name = :name', { email, name });

        if (excludeId) {
            query.andWhere('user.id != :excludeId', { excludeId });
        }

        const existingUsers = await query.getMany();

        if (existingUsers.length > 0) {
            throw new ConflictException('User with this email or user name already exists.');
        }
    }
}
