import {
    ConflictException,
    InternalServerErrorException,
    UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserService } from '@/module-user/services/user.service';
import { User } from '@/module-user/entities/user.entity';
import { Argon2HashUtil } from '@/common/utils/hash.util';
import { UserRoles } from '@/module-auth/enums/role.enum';

jest.mock('@/common/utils/hash.util', () => ({
    Argon2HashUtil: {
        hash: jest.fn().mockResolvedValue('hashed'),
        compare: jest.fn(),
    },
}));

const createQueryBuilderMock = () => {
    const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([] as User[]),
    };
    return qb;
};

describe('UserService', () => {
    let service: UserService;
    let repository: jest.Mocked<Repository<User>>;
    let queryBuilder: ReturnType<typeof createQueryBuilderMock>;

    const baseUser: User = {
        id: 'user-id',
        name: 'john',
        email: 'john@example.com',
        password: 'hash',
        role: UserRoles.CUSTOMER,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        tokens: [],
        apiKeys: [],
    } as User;

    beforeEach(() => {
        queryBuilder = createQueryBuilderMock();
        repository = {
            find: jest.fn().mockResolvedValue([]),
            save: jest.fn().mockResolvedValue(baseUser),
            findOne: jest.fn(),
            update: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue({}),
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
        } as unknown as jest.Mocked<Repository<User>>;

        service = new UserService(repository as unknown as Repository<User>);
        jest.clearAllMocks();
    });

    describe('create', () => {
        const dto = { name: 'john', email: 'john@example.com', password: 'Secret123' } as never;

        it('hashes password and saves user when unique', async () => {
            const result = await service.create(dto);

            expect(repository.save).toHaveBeenCalledWith(
                expect.objectContaining({ password: 'hashed' }),
            );
            expect(result).toBe(baseUser);
        });

        it('throws ConflictException when user already exists', async () => {
            repository.find.mockResolvedValue([baseUser]);

            await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
        });

        it('converts repository unique violations into ConflictException', async () => {
            const uniqueError = Object.assign(new Error('duplicate'), { code: '23505' });
            repository.save.mockRejectedValue(uniqueError);

            await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
        });
    });

    describe('findAll', () => {
        it('returns repository results', async () => {
            repository.find.mockResolvedValue([baseUser]);

            const result = await service.findAll({
                name: 'john',
                email: 'john@example.com',
            } as never);

            expect(result).toEqual([baseUser]);
        });
    });

    describe('findById', () => {
        it('returns stored user by id', async () => {
            repository.findOne.mockResolvedValue(baseUser);

            const result = await service.findById('user-id');

            expect(result).toBe(baseUser);
        });
    });

    describe('findByLogin', () => {
        it('returns user when login matches email or username', async () => {
            repository.findOne.mockResolvedValue(baseUser);

            const result = await service.findByLogin('john');

            expect(result).toBe(baseUser);
        });

        it('throws UnauthorizedException when user is missing', async () => {
            repository.findOne.mockResolvedValue(null);

            await expect(service.findByLogin('missing')).rejects.toBeInstanceOf(
                UnauthorizedException,
            );
        });
    });

    describe('update', () => {
        const updateDto = { name: 'New Name', password: 'NewPass123' } as never;

        it('updates existing user and returns latest entity', async () => {
            repository.findOne
                .mockResolvedValueOnce(baseUser)
                .mockResolvedValueOnce({ ...baseUser, name: 'New Name' } as User);

            const result = await service.update('user-id', updateDto);

            expect(repository.update).toHaveBeenCalledWith(
                'user-id',
                expect.objectContaining({ name: 'New Name', password: 'hashed' }),
            );
            expect(result).toMatchObject({ name: 'New Name' });
        });

        it('throws InternalServerErrorException when target user does not exist', async () => {
            repository.findOne.mockResolvedValueOnce(null);

            await expect(service.update('missing', updateDto)).rejects.toBeInstanceOf(
                InternalServerErrorException,
            );
            expect(repository.update).not.toHaveBeenCalled();
        });

        it('throws InternalServerErrorException when duplicate user found', async () => {
            repository.findOne.mockResolvedValue(baseUser);
            queryBuilder.getMany.mockResolvedValue([{ id: 'other' } as User]);

            await expect(service.update('user-id', updateDto)).rejects.toBeInstanceOf(
                InternalServerErrorException,
            );
        });

        it('converts update unique violations into InternalServerErrorException', async () => {
            repository.findOne.mockResolvedValue(baseUser);
            const uniqueError = Object.assign(new Error('duplicate'), { code: '23505' });
            repository.update.mockRejectedValue(uniqueError);

            await expect(service.update('user-id', updateDto)).rejects.toBeInstanceOf(
                InternalServerErrorException,
            );
        });
    });

    describe('remove', () => {
        it('deletes an existing user', async () => {
            repository.findOne.mockResolvedValue(baseUser);

            await service.remove('user-id');

            expect(repository.delete).toHaveBeenCalledWith('user-id');
        });

        it('throws InternalServerErrorException when user is missing', async () => {
            repository.findOne.mockResolvedValue(null);

            await expect(service.remove('user-id')).rejects.toBeInstanceOf(
                InternalServerErrorException,
            );
        });
    });
});
