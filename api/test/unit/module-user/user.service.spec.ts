import {
    ConflictException,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserService } from '@/module-user/services/user.service';
import { User } from '@/module-user/entities/user.entity';
import { buildUserEntity } from '../../fixtures/users.fixtures';

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
    let repository: Repository<User>;
    let queryBuilder: ReturnType<typeof createQueryBuilderMock>;
    let saveMock: jest.MockedFunction<Repository<User>['save']>;
    let findMock: jest.MockedFunction<Repository<User>['find']>;
    let findOneMock: jest.MockedFunction<Repository<User>['findOne']>;
    let updateMock: jest.MockedFunction<Repository<User>['update']>;
    let deleteMock: jest.MockedFunction<Repository<User>['delete']>;

    const baseUser: User = buildUserEntity({
        id: 'user-id',
        name: 'john',
        email: 'john@example.com',
    });

    beforeEach(() => {
        queryBuilder = createQueryBuilderMock();
        saveMock = jest.fn<
            ReturnType<Repository<User>['save']>,
            Parameters<Repository<User>['save']>
        >();
        findMock = jest.fn<
            ReturnType<Repository<User>['find']>,
            Parameters<Repository<User>['find']>
        >();
        findOneMock = jest.fn<
            ReturnType<Repository<User>['findOne']>,
            Parameters<Repository<User>['findOne']>
        >();
        updateMock = jest.fn<
            ReturnType<Repository<User>['update']>,
            Parameters<Repository<User>['update']>
        >();
        deleteMock = jest.fn<
            ReturnType<Repository<User>['delete']>,
            Parameters<Repository<User>['delete']>
        >();
        findMock.mockResolvedValue([]);
        saveMock.mockResolvedValue(baseUser);
        updateMock.mockResolvedValue(undefined);
        deleteMock.mockResolvedValue({});
        const repositoryImpl: Partial<Repository<User>> = {
            find: findMock,
            save: saveMock,
            findOne: findOneMock,
            update: updateMock,
            delete: deleteMock,
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
        };
        repository = repositoryImpl as Repository<User>;

        service = new UserService(repository);
        jest.clearAllMocks();
    });

    describe('create', () => {
        const dto: Parameters<UserService['create']>[0] = {
            name: 'john',
            email: 'john@example.com',
            password: 'Secret123',
        };

        it('hashes password and saves user when unique', async () => {
            const result = await service.create(dto);

            expect(saveMock).toHaveBeenCalledWith(expect.objectContaining({ password: 'hashed' }));
            expect(result).toBe(baseUser);
        });

        it('throws ConflictException when user already exists', async () => {
            findMock.mockResolvedValue([baseUser]);

            await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
        });

        it('converts repository unique violations into ConflictException', async () => {
            const uniqueError = Object.assign(new Error('duplicate'), { code: '23505' });
            saveMock.mockRejectedValue(uniqueError);

            await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
        });
    });

    describe('findAll', () => {
        it('returns repository results', async () => {
            findMock.mockResolvedValue([baseUser]);

            const result = await service.findAll({
                name: 'john',
                email: 'john@example.com',
            });

            expect(result).toEqual([baseUser]);
        });
    });

    describe('findById', () => {
        it('returns stored user by id', async () => {
            findOneMock.mockResolvedValue(baseUser);

            const result = await service.findById('user-id');

            expect(result).toBe(baseUser);
        });
    });

    describe('findByLogin', () => {
        it('returns user when login matches email or username', async () => {
            findOneMock.mockResolvedValue(baseUser);

            const result = await service.findByLogin('john');

            expect(result).toBe(baseUser);
        });

        it('throws UnauthorizedException when user is missing', async () => {
            findOneMock.mockResolvedValue(null);

            await expect(service.findByLogin('missing')).rejects.toBeInstanceOf(
                UnauthorizedException,
            );
        });
    });

    describe('update', () => {
        const updateDto: Parameters<UserService['update']>[1] = {
            name: 'New Name',
            password: 'NewPass123',
        };

        it('updates existing user and returns latest entity', async () => {
            findOneMock
                .mockResolvedValueOnce(baseUser)
                .mockResolvedValueOnce({ ...baseUser, name: 'New Name' } as User);

            const result = await service.update('user-id', updateDto);

            expect(updateMock).toHaveBeenCalledWith(
                'user-id',
                expect.objectContaining({ name: 'New Name', password: 'hashed' }),
            );
            expect(result).toMatchObject({ name: 'New Name' });
        });

        it('throws InternalServerErrorException when target user does not exist', async () => {
            findOneMock.mockResolvedValueOnce(null);

            await expect(service.update('missing', updateDto)).rejects.toBeInstanceOf(
                NotFoundException,
            );
            expect(updateMock).not.toHaveBeenCalled();
        });

        it('throws ConflictException when duplicate user found', async () => {
            findOneMock.mockResolvedValue(baseUser);
            queryBuilder.getMany.mockResolvedValue([{ id: 'other' } as User]);

            await expect(service.update('user-id', updateDto)).rejects.toBeInstanceOf(
                ConflictException,
            );
        });

        it('converts update unique violations into ConflictException', async () => {
            findOneMock.mockResolvedValue(baseUser);
            const uniqueError = Object.assign(new Error('duplicate'), { code: '23505' });
            updateMock.mockRejectedValue(uniqueError);

            await expect(service.update('user-id', updateDto)).rejects.toBeInstanceOf(
                ConflictException,
            );
        });

        it('wraps unexpected repository errors into InternalServerErrorException', async () => {
            findOneMock.mockResolvedValue(baseUser);
            updateMock.mockRejectedValue(new Error('db down'));

            await expect(service.update('user-id', updateDto)).rejects.toBeInstanceOf(
                InternalServerErrorException,
            );
        });
    });

    describe('remove', () => {
        it('deletes an existing user', async () => {
            findOneMock.mockResolvedValue(baseUser);

            await service.remove('user-id');

            expect(deleteMock).toHaveBeenCalledWith('user-id');
        });

        it('throws NotFoundException when user is missing', async () => {
            findOneMock.mockResolvedValue(null);

            await expect(service.remove('user-id')).rejects.toBeInstanceOf(NotFoundException);
        });

        it('wraps unexpected delete errors into InternalServerErrorException', async () => {
            findOneMock.mockResolvedValue(baseUser);
            deleteMock.mockRejectedValue(new Error('db error'));

            await expect(service.remove('user-id')).rejects.toBeInstanceOf(
                InternalServerErrorException,
            );
        });
    });
});
