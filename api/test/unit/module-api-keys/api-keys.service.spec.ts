import {
    BadRequestException,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiKeysService } from '@/module-api-keys/services/api-keys.service';
import { ApiKeysRepositoryService } from '@/module-api-keys/services/api-keys.repository.service';
import { ApiKeysValidationService } from '@/module-api-keys/services/api-keys-validation.service';
import { EXCHANGES, MARKET_TYPES } from '@/module-api-keys/enums/api-keys.enums';
import { ApiKeysAccessService } from '@/module-api-keys/services/api-keys-access.service';
import { ApiKeysViewService } from '@/module-api-keys/services/api-keys-view.service';
import { buildCreateApiKeyDto } from '../../fixtures/api-keys.fixtures';

type AwaitedReturn<T> = T extends Promise<infer R> ? R : T;

describe('ApiKeysService', () => {
    let service: ApiKeysService;
    let repository: {
        saveApiKey: jest.MockedFunction<ApiKeysRepositoryService['saveApiKey']>;
        update: jest.MockedFunction<ApiKeysRepositoryService['update']>;
        getUserApiKeys: jest.MockedFunction<ApiKeysRepositoryService['getUserApiKeys']>;
        getUserApiKeyById: jest.MockedFunction<ApiKeysRepositoryService['getUserApiKeyById']>;
    };
    let validationService: {
        validate: jest.MockedFunction<ApiKeysValidationService['validate']>;
    };
    let accessService: {
        getAuthorizedUserId: jest.MockedFunction<ApiKeysAccessService['getAuthorizedUserId']>;
        getOwnedActiveApiKey: jest.MockedFunction<ApiKeysAccessService['getOwnedActiveApiKey']>;
    };
    let viewService: {
        encryptCredentials: jest.MockedFunction<ApiKeysViewService['encryptCredentials']>;
        toMaskedApiKeyResponse: jest.MockedFunction<ApiKeysViewService['toMaskedApiKeyResponse']>;
        maskApiKeyList: jest.MockedFunction<ApiKeysViewService['maskApiKeyList']>;
        toDecryptedCredentials: jest.MockedFunction<ApiKeysViewService['toDecryptedCredentials']>;
    };
    const request = { cookies: {} } as Request;

    const apiKeyDto = buildCreateApiKeyDto();

    beforeEach(() => {
        repository = {
            saveApiKey: jest.fn(),
            update: jest.fn(),
            getUserApiKeys: jest.fn(),
            getUserApiKeyById: jest.fn(),
        };

        validationService = {
            validate: jest.fn(),
        };

        accessService = {
            getAuthorizedUserId: jest.fn(),
            getOwnedActiveApiKey: jest.fn(),
        };

        viewService = {
            encryptCredentials: jest.fn((apiKey: string, secretKey: string) => ({
                encryptedApiKey: `enc-${apiKey}`,
                encryptedSecretKey: `enc-${secretKey}`,
            })),
            toMaskedApiKeyResponse: jest.fn((apiKey, rawApiKey, exchangeUserAccountId) => ({
                id: apiKey.id,
                apiKey: `***${rawApiKey.slice(-4)}`,
                exchange: apiKey.exchange,
                apiKeyName: apiKey.apiKeyName,
                connectionStatus: apiKey.connectionStatus,
                market: apiKey.market,
                exchangeUserAccountId,
            })),
            maskApiKeyList: jest.fn(apiKeys =>
                apiKeys.map(item => ({ ...item, apiKey: `***${String(item.apiKey).slice(-4)}` })),
            ),
            toDecryptedCredentials: jest.fn(apiKey => ({
                ...apiKey,
                apiKey: 'ABCD',
                secretKey: 'SECRET',
            })),
        };

        service = new ApiKeysService(
            repository as unknown as ApiKeysRepositoryService,
            validationService as unknown as ApiKeysValidationService,
            accessService as unknown as ApiKeysAccessService,
            viewService as unknown as ApiKeysViewService,
        );
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('persists api keys after validation and masks response', async () => {
            accessService.getAuthorizedUserId.mockReturnValue('user-id');
            validationService.validate.mockResolvedValue({
                valid: true,
                exchangeUserAccountId: 'uid',
            });
            repository.saveApiKey.mockResolvedValue({
                id: 'key-id',
                exchange: EXCHANGES.BYBIT,
                apiKeyName: 'Main',
                connectionStatus: 'CONNECTED',
                market: MARKET_TYPES.FUTURES,
            } as AwaitedReturn<ReturnType<ApiKeysRepositoryService['saveApiKey']>>);

            const result = await service.create(request, apiKeyDto);

            expect(validationService.validate).toHaveBeenCalledWith(
                apiKeyDto.apiKey,
                apiKeyDto.secretKey,
                apiKeyDto.exchange,
            );
            expect(repository.saveApiKey).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'user-id',
                    apiKey: `enc-${apiKeyDto.apiKey}`,
                    secretKey: `enc-${apiKeyDto.secretKey}`,
                }),
            );
            expect(viewService.toMaskedApiKeyResponse).toHaveBeenCalled();
            expect(result).toMatchObject({
                id: 'key-id',
                apiKey: `***${apiKeyDto.apiKey.slice(-4)}`,
                exchangeUserAccountId: 'uid',
            });
        });

        it('throws UnauthorizedException when user is missing', async () => {
            accessService.getAuthorizedUserId.mockImplementation(() => {
                throw new UnauthorizedException('Invalid or missing user.');
            });

            await expect(service.create(request, apiKeyDto)).rejects.toBeInstanceOf(
                UnauthorizedException,
            );
        });

        it('throws BadRequestException when validation fails', async () => {
            accessService.getAuthorizedUserId.mockReturnValue('user-id');
            validationService.validate.mockResolvedValue({
                valid: false,
                exchangeUserAccountId: null,
            });

            await expect(service.create(request, apiKeyDto)).rejects.toBeInstanceOf(
                BadRequestException,
            );
        });

        it('converts unexpected errors into InternalServerErrorException', async () => {
            accessService.getAuthorizedUserId.mockReturnValue('user-id');
            validationService.validate.mockResolvedValue({
                valid: true,
                exchangeUserAccountId: 'uid',
            });
            repository.saveApiKey.mockRejectedValue(new Error('db down'));

            await expect(service.create(request, apiKeyDto)).rejects.toBeInstanceOf(
                InternalServerErrorException,
            );
        });
    });

    describe('getUserApiKeys', () => {
        it('decrypts stored values and masks api keys', async () => {
            accessService.getAuthorizedUserId.mockReturnValue('user-id');
            repository.getUserApiKeys.mockResolvedValue([
                {
                    id: 'key-id',
                    apiKey: 'enc-ABCD1234567890',
                    exchange: EXCHANGES.BYBIT,
                    apiKeyName: 'Main',
                    connectionStatus: 'CONNECTED',
                    market: MARKET_TYPES.FUTURES,
                } as AwaitedReturn<ReturnType<ApiKeysRepositoryService['getUserApiKeys']>>[number],
            ]);

            const result = await service.getUserApiKeys(request);

            expect(viewService.maskApiKeyList).toHaveBeenCalled();
            expect(result[0]).toMatchObject({ apiKey: '***7890' });
        });

        it('throws Unauthorized when token is missing', async () => {
            accessService.getAuthorizedUserId.mockImplementation(() => {
                throw new UnauthorizedException('Invalid or missing user.');
            });

            await expect(service.getUserApiKeys(request)).rejects.toBeInstanceOf(
                UnauthorizedException,
            );
        });

        it('raises InternalServerErrorException when repository fails', async () => {
            accessService.getAuthorizedUserId.mockReturnValue('user-id');
            repository.getUserApiKeys.mockRejectedValue(new Error('db failure'));

            await expect(service.getUserApiKeys(request)).rejects.toBeInstanceOf(
                InternalServerErrorException,
            );
        });
    });

    describe('getActiveUserApiCredentials', () => {
        it('returns decrypted credentials when found', async () => {
            repository.getUserApiKeyById.mockResolvedValue({
                id: 'key-id',
                apiKey: 'enc-ABCD',
                secretKey: 'enc-SECRET',
            } as AwaitedReturn<ReturnType<ApiKeysRepositoryService['getUserApiKeyById']>>);

            const result = await service.getActiveUserApiCredentials('key-id');

            expect(result).toMatchObject({ apiKey: 'ABCD', secretKey: 'SECRET' });
            expect(viewService.toDecryptedCredentials).toHaveBeenCalledTimes(1);
        });

        it('returns null when repository does not find record', async () => {
            repository.getUserApiKeyById.mockResolvedValue(null);

            const result = await service.getActiveUserApiCredentials('missing');

            expect(result).toBeNull();
        });
    });

    describe('update', () => {
        it('updates owned api keys after validation and masks response', async () => {
            accessService.getAuthorizedUserId.mockReturnValue('user-id');
            accessService.getOwnedActiveApiKey.mockResolvedValue({
                id: 'key-id',
                userId: 'user-id',
                apiKey: 'enc-OLDAPI',
                secretKey: 'enc-OLDSECRET',
                exchange: EXCHANGES.BYBIT,
                market: MARKET_TYPES.FUTURES,
                apiKeyName: 'Old name',
                connectionStatus: 'CONNECTED',
            } as AwaitedReturn<ReturnType<ApiKeysAccessService['getOwnedActiveApiKey']>>);
            validationService.validate.mockResolvedValue({
                valid: true,
                exchangeUserAccountId: 'updated-user-id',
            });
            repository.update.mockResolvedValue({
                affected: 1,
            } as AwaitedReturn<ReturnType<ApiKeysRepositoryService['update']>>);

            const result = await service.update(request, 'key-id', {
                apiKey: 'NEWAPI',
                secretKey: 'NEWSECRET',
                exchange: EXCHANGES.BYBIT,
                apiKeyName: 'Updated name',
                market: MARKET_TYPES.FUTURES,
            });

            expect(validationService.validate).toHaveBeenCalledWith(
                'NEWAPI',
                'NEWSECRET',
                EXCHANGES.BYBIT,
            );
            expect(repository.update).toHaveBeenCalledWith(
                'key-id',
                expect.objectContaining({
                    apiKeyName: 'Updated name',
                    apiKey: 'enc-NEWAPI',
                    secretKey: 'enc-NEWSECRET',
                    exchange: EXCHANGES.BYBIT,
                    market: MARKET_TYPES.FUTURES,
                    exchangeUserAccountId: 'updated-user-id',
                }),
            );
            expect(result).toMatchObject({
                id: 'key-id',
                apiKey: '***WAPI',
                apiKeyName: 'Updated name',
                exchange: EXCHANGES.BYBIT,
                market: MARKET_TYPES.FUTURES,
                exchangeUserAccountId: 'updated-user-id',
            });
        });

        it('throws UnauthorizedException when user is missing', async () => {
            accessService.getAuthorizedUserId.mockImplementation(() => {
                throw new UnauthorizedException('Invalid or missing user.');
            });

            await expect(service.update(request, 'key-id', {})).rejects.toBeInstanceOf(
                UnauthorizedException,
            );
        });

        it('throws NotFoundException when api key does not exist', async () => {
            accessService.getAuthorizedUserId.mockReturnValue('user-id');
            accessService.getOwnedActiveApiKey.mockImplementation(async () => {
                throw new NotFoundException('API key not found.');
            });

            await expect(service.update(request, 'missing', {})).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });

        it('throws UnauthorizedException when user does not own the key', async () => {
            accessService.getAuthorizedUserId.mockReturnValue('user-id');
            accessService.getOwnedActiveApiKey.mockImplementation(async () => {
                throw new UnauthorizedException('Invalid or missing user.');
            });

            await expect(service.update(request, 'key-id', {})).rejects.toBeInstanceOf(
                UnauthorizedException,
            );
        });

        it('throws BadRequestException when validation fails', async () => {
            accessService.getAuthorizedUserId.mockReturnValue('user-id');
            accessService.getOwnedActiveApiKey.mockResolvedValue({
                id: 'key-id',
                userId: 'user-id',
                apiKey: 'enc-OLDAPI',
                secretKey: 'enc-OLDSECRET',
                exchange: EXCHANGES.BYBIT,
                market: MARKET_TYPES.FUTURES,
                apiKeyName: 'Old name',
                connectionStatus: 'CONNECTED',
            } as AwaitedReturn<ReturnType<ApiKeysAccessService['getOwnedActiveApiKey']>>);
            validationService.validate.mockResolvedValue({
                valid: false,
                exchangeUserAccountId: null,
            });

            await expect(service.update(request, 'key-id', {})).rejects.toBeInstanceOf(
                BadRequestException,
            );
        });

        it('throws BadRequestException when update payload is incomplete', async () => {
            accessService.getAuthorizedUserId.mockReturnValue('user-id');
            accessService.getOwnedActiveApiKey.mockResolvedValue({
                id: 'key-id',
                userId: 'user-id',
                apiKey: 'enc-OLDAPI',
                secretKey: 'enc-OLDSECRET',
                exchange: EXCHANGES.BYBIT,
                market: MARKET_TYPES.FUTURES,
                apiKeyName: 'Old name',
                connectionStatus: 'CONNECTED',
            } as AwaitedReturn<ReturnType<ApiKeysAccessService['getOwnedActiveApiKey']>>);

            await expect(
                service.update(request, 'key-id', {
                    apiKey: 'NEWAPI',
                    secretKey: 'NEWSECRET',
                    exchange: EXCHANGES.BYBIT,
                }),
            ).rejects.toThrow('All API key update fields are required.');
        });

        it('throws NotFoundException when repository updates zero rows', async () => {
            accessService.getAuthorizedUserId.mockReturnValue('user-id');
            accessService.getOwnedActiveApiKey.mockResolvedValue({
                id: 'key-id',
                userId: 'user-id',
                apiKey: 'enc-OLDAPI',
                secretKey: 'enc-OLDSECRET',
                exchange: EXCHANGES.BYBIT,
                market: MARKET_TYPES.FUTURES,
                apiKeyName: 'Old name',
                connectionStatus: 'CONNECTED',
            } as AwaitedReturn<ReturnType<ApiKeysAccessService['getOwnedActiveApiKey']>>);
            validationService.validate.mockResolvedValue({
                valid: true,
                exchangeUserAccountId: 'updated-user-id',
            });
            repository.update.mockResolvedValue({
                affected: 0,
            } as AwaitedReturn<ReturnType<ApiKeysRepositoryService['update']>>);

            await expect(
                service.update(request, 'key-id', {
                    apiKey: 'NEWAPI',
                    secretKey: 'NEWSECRET',
                    exchange: EXCHANGES.BYBIT,
                    apiKeyName: 'Updated name',
                    market: MARKET_TYPES.FUTURES,
                }),
            ).rejects.toBeInstanceOf(NotFoundException);
        });
    });
});
