import {
    ConflictException,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { UserService } from '@/module-user/services/user.service';
import { User } from '@/module-user/entities/user.entity';
import { buildUserEntity } from '../../fixtures/users.fixtures';
import { UserPasswordService } from '@/module-user/services/user-password.service';
import { UserUniquenessService } from '@/module-user/services/user-uniqueness.service';

describe('UserService', () => {
    let service: UserService;
    let repository: Repository<User>;
    let saveMock: jest.Mock<Promise<User>, [Partial<User>]>;
    let findMock: jest.Mock<Promise<User[]>, [object?]>;
    let findOneMock: jest.Mock<Promise<User | null>, [object]>;
    let updateMock: jest.Mock<Promise<UpdateResult>, [string, Partial<User>]>;
    let deleteMock: jest.Mock<Promise<DeleteResult>, [string]>;
    let userPasswordService: {
        hashPassword: jest.MockedFunction<UserPasswordService['hashPassword']>;
    };
    let userUniquenessService: {
        ensureUnique: jest.MockedFunction<UserUniquenessService['ensureUnique']>;
    };

    const baseUser: User = buildUserEntity({
        id: 'user-id',
        name: 'john',
        email: 'john@example.com',
    });

    beforeEach(() => {
        saveMock = jest.fn();
        findMock = jest.fn();
        findOneMock = jest.fn();
        updateMock = jest.fn();
        deleteMock = jest.fn();
        userPasswordService = {
            hashPassword: jest.fn().mockResolvedValue('hashed'),
        };
        userUniquenessService = {
            ensureUnique: jest.fn(),
        };
        findMock.mockResolvedValue([]);
        saveMock.mockResolvedValue(baseUser);
        updateMock.mockResolvedValue({ affected: 1, generatedMaps: [], raw: [] });
        deleteMock.mockResolvedValue({ affected: 1, raw: {} });
        const repositoryImpl: Partial<Repository<User>> = {
            find: findMock,
            save: saveMock as unknown as Repository<User>['save'],
            findOne: findOneMock,
            update: updateMock as unknown as Repository<User>['update'],
            delete: deleteMock as unknown as Repository<User>['delete'],
        };
        repository = repositoryImpl as Repository<User>;

        service = new UserService(
            repository,
            userPasswordService as unknown as UserPasswordService,
            userUniquenessService as unknown as UserUniquenessService,
        );
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
            userUniquenessService.ensureUnique.mockRejectedValue(
                new ConflictException('duplicate'),
            );

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
                password: 'Secret123',
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
            userUniquenessService.ensureUnique.mockRejectedValue(
                new ConflictException('duplicate'),
            );

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
