import {
    ConflictException,
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
            if (error instanceof Error) {
                if ('code' in error && error?.code === '23505') {
                    throw new ConflictException(
                        'User with this email or user name already exists.',
                    );
                }

                throw new InternalServerErrorException(error.message);
            }

            throw new InternalServerErrorException(
                'An unexpected error occurred while creating the user.',
            );
        }
    }

    async findAll(createUserDto: CreateUserDto): Promise<User[]> {
        try {
            const { name, email } = createUserDto;

            return this.userRepository.find({
                where: [{ name }, { email }],
            });
        } catch (error) {
            if (error instanceof Error) {
                if ('code' in error && error?.code === '23505') {
                    throw new ConflictException(
                        'An unexpected error occurred while fetching users.',
                    );
                }

                throw new InternalServerErrorException(error.message);
            }

            throw new InternalServerErrorException('An unexpected error occurred');
        }
    }

    async findById(id: string): Promise<User | null> {
        try {
            return this.userRepository.findOne({
                where: {
                    id,
                },
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                if ('code' in error && error?.code === '23505') {
                    throw new ConflictException(`User with this id: ${id} already exists.`);
                }

                throw new InternalServerErrorException(error.message);
            }

            throw new InternalServerErrorException(
                'An unexpected error occurred while fetching the user.',
            );
        }
    }

    async findByLogin(login: string): Promise<User | null> {
        const user: User | null = await this.userRepository.findOne({
            where: [{ email: login }, { name: login }],
        });

        if (!user) {
            throw new UnauthorizedException('Invalid login or password');
        }

        return user;
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
        try {
            const user: User | null = await this.findById(id);

            if (!user) {
                throw new ConflictException(`User with ID '${id}' not found.`);
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

            try {
                await this.userRepository.update(id, updateData);

                return await this.findById(id);
            } catch (error: unknown) {
                if (error instanceof Error) {
                    if ('code' in error && error?.code === '23505') {
                        throw new ConflictException(
                            'User with this email or user name already exists.',
                        );
                    }

                    throw new InternalServerErrorException(error.message);
                }

                throw new InternalServerErrorException(
                    'An unexpected error occurred while updating the user.',
                );
            }
        } catch (error) {
            if (error instanceof Error) {
                if ('code' in error && error?.code === '23505') {
                    throw new ConflictException(
                        'User with this email or user name already exists.',
                    );
                }

                throw new InternalServerErrorException(error.message);
            }

            throw new InternalServerErrorException('An unexpected error occurred');
        }
    }

    async remove(id: string): Promise<DeleteResult> {
        try {
            const user: User | null = await this.findById(id);

            if (!user) {
                throw new NotFoundException(`User with ID ${id} not found`);
            }

            return this.userRepository.delete(id);
        } catch (error) {
            if (error instanceof Error) {
                if ('code' in error && error?.code === '23505') {
                    throw new ConflictException(
                        'User with this email or user name already exists.',
                    );
                }

                throw new InternalServerErrorException(error.message);
            }

            throw new InternalServerErrorException('An unexpected error occurred');
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
}
