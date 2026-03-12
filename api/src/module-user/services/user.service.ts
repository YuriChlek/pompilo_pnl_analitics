import {
    ConflictException,
    HttpException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Argon2HashUtil } from '@/common/utils/hash.util';
import { RegisterUserDto } from '@/module-auth/dto/register-user.dto';

@Injectable()
export class UserService {
    public constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async create(createUserDto: CreateUserDto | RegisterUserDto): Promise<User> {
        const users: User[] = await this.findAll(createUserDto);

        if (users.length) {
            throw new ConflictException('User with this email or user name already exists.');
        }

        try {
            const { name, email, password } = createUserDto;
            const hashPassword = await Argon2HashUtil.hash(password);

            return await this.userRepository.save({
                name,
                email,
                password: hashPassword,
            });
        } catch (error) {
            this.handleUnexpectedDatabaseError(error, 'Failed to create user.', {
                treatUniqueAsConflict: true,
            });
        }
    }

    async findAll(createUserDto: CreateUserDto): Promise<User[]> {
        try {
            const { name, email } = createUserDto;

            return await this.userRepository.find({
                where: [{ name }, { email }],
            });
        } catch (error) {
            this.handleUnexpectedDatabaseError(error, 'Failed to fetch users.');
        }
    }

    async findById(id: string): Promise<User | null> {
        try {
            return await this.userRepository.findOne({
                where: {
                    id,
                },
            });
        } catch (error: unknown) {
            this.handleUnexpectedDatabaseError(error, 'Failed to fetch the user.');
        }
    }

    async findByLogin(login: string): Promise<User | null> {
        try {
            const user: User | null = await this.userRepository.findOne({
                where: [{ email: login }, { name: login }],
            });

            if (!user) {
                throw new UnauthorizedException('Invalid login or password');
            }

            return user;
        } catch (error) {
            this.handleUnexpectedDatabaseError(error, 'Failed to fetch user by login.');
        }
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
        try {
            const user: User | null = await this.findById(id);

            if (!user) {
                throw new NotFoundException(`User with ID '${id}' not found.`);
            }

            if (updateUserDto.email || updateUserDto.name) {
                const existingUsers = await this.checkUserExists(
                    updateUserDto.email || user.email,
                    updateUserDto.name || user.name,
                    id,
                );

                if (existingUsers.length > 0) {
                    throw new ConflictException(
                        'A user with this email or username already exists.',
                    );
                }
            }

            const updateData: Partial<User> = {};

            if (updateUserDto.name) updateData.name = updateUserDto.name;
            if (updateUserDto.email) updateData.email = updateUserDto.email;
            if (updateUserDto.role) updateData.role = updateUserDto.role;
            if (updateUserDto.password) {
                updateData.password = await Argon2HashUtil.hash(updateUserDto.password);
            }

            await this.userRepository.update(id, updateData);

            return await this.findById(id);
        } catch (error) {
            this.handleUnexpectedDatabaseError(error, 'Failed to update user.', {
                treatUniqueAsConflict: true,
            });
        }
    }

    async remove(id: string): Promise<DeleteResult> {
        try {
            const user: User | null = await this.findById(id);

            if (!user) {
                throw new NotFoundException(`User with ID ${id} not found`);
            }

            return await this.userRepository.delete(id);
        } catch (error) {
            this.handleUnexpectedDatabaseError(error, 'Failed to remove user.');
        }
    }

    private async checkUserExists(
        email: string,
        name: string,
        excludeId?: string,
    ): Promise<User[]> {
        const query = this.userRepository
            .createQueryBuilder('user')
            .where('user.email = :email OR user.name = :name', { email, name });

        if (excludeId) {
            query.andWhere('user.id != :excludeId', { excludeId });
        }

        return query.getMany();
    }

    private handleUnexpectedDatabaseError(
        error: unknown,
        message: string,
        options?: { treatUniqueAsConflict?: boolean },
    ): never {
        if (error instanceof HttpException) {
            throw error;
        }

        if (options?.treatUniqueAsConflict && this.isUniqueViolation(error)) {
            throw new ConflictException('User with this email or user name already exists.');
        }

        throw new InternalServerErrorException(message);
    }

    private isUniqueViolation(error: unknown): boolean {
        return Boolean(
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            (error as { code?: string }).code === '23505',
        );
    }
}
