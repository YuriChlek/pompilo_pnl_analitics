import {
    BadRequestException,
    InternalServerErrorException,
    UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiKeysService } from '@/module-api-keys/services/api-keys.service';
import { TokenService } from '@/module-auth-token/services/token.service';
import { EncryptService } from '@/module-encrypt/services/encrypt.service';
import { ApiKeysRepositoryService } from '@/module-api-keys/services/api-keys.repository.service';
import { ApiKeysValidationService } from '@/module-api-keys/services/api-keys-validation.service';
import { Exchanges, MarketTypes } from '@/module-api-keys/enums';
import { getUserIdFromToken } from '@/common/utils/get-user-id-from-tocken';
import { buildCreateApiKeyDto } from '../../fixtures/api-keys.fixtures';

jest.mock('@/common/utils/get-user-id-from-tocken', () => ({
    getUserIdFromToken: jest.fn(),
}));

type AwaitedReturn<T> = T extends Promise<infer R> ? R : T;

describe('ApiKeysService', () => {
    let service: ApiKeysService;
    let tokenService: {
        verifyToken: jest.MockedFunction<TokenService['verifyToken']>;
    };
    let encryptService: {
        encrypt: jest.MockedFunction<EncryptService['encrypt']>;
        decrypt: jest.MockedFunction<EncryptService['decrypt']>;
    };
    let repository: {
        saveApiKey: jest.MockedFunction<ApiKeysRepositoryService['saveApiKey']>;
        getUserApiKeys: jest.MockedFunction<ApiKeysRepositoryService['getUserApiKeys']>;
        getUserApiKeyById: jest.MockedFunction<ApiKeysRepositoryService['getUserApiKeyById']>;
    };
    let validationService: {
        validate: jest.MockedFunction<ApiKeysValidationService['validate']>;
    };
    const request = { cookies: {} } as Request;

    const apiKeyDto = buildCreateApiKeyDto();

    beforeEach(() => {
        tokenService = {
            verifyToken: jest.fn(),
        };

        encryptService = {
            encrypt: jest.fn((value: string) => `enc-${value}`),
            decrypt: jest.fn((value: string) => value.replace('enc-', '')),
        };

        repository = {
            saveApiKey: jest.fn(),
            getUserApiKeys: jest.fn(),
            getUserApiKeyById: jest.fn(),
        };

        validationService = {
            validate: jest.fn(),
        };

        service = new ApiKeysService(
            tokenService as unknown as TokenService,
            encryptService as unknown as EncryptService,
            repository as unknown as ApiKeysRepositoryService,
            validationService as unknown as ApiKeysValidationService,
        );
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('persists api keys after validation and masks response', async () => {
            (getUserIdFromToken as jest.Mock).mockReturnValue('user-id');
            validationService.validate.mockResolvedValue({
                valid: true,
                exchangeUserAccountId: 'uid',
            });
            repository.saveApiKey.mockResolvedValue({
                id: 'key-id',
                exchange: Exchanges.BYBIT,
                apiKeyName: 'Main',
                connectionStatus: 'CONNECTED',
                market: MarketTypes.FUTURES,
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
            expect(result).toMatchObject({
                id: 'key-id',
                apiKey: `***${apiKeyDto.apiKey.slice(-4)}`,
                exchangeUserAccountId: 'uid',
            });
        });

        it('throws UnauthorizedException when user is missing', async () => {
            (getUserIdFromToken as jest.Mock).mockReturnValue(null);

            await expect(service.create(request, apiKeyDto)).rejects.toBeInstanceOf(
                UnauthorizedException,
            );
        });

        it('throws BadRequestException when validation fails', async () => {
            (getUserIdFromToken as jest.Mock).mockReturnValue('user-id');
            validationService.validate.mockResolvedValue({
                valid: false,
                exchangeUserAccountId: null,
            });

            await expect(service.create(request, apiKeyDto)).rejects.toBeInstanceOf(
                BadRequestException,
            );
        });

        it('converts unexpected errors into InternalServerErrorException', async () => {
            (getUserIdFromToken as jest.Mock).mockReturnValue('user-id');
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
            (getUserIdFromToken as jest.Mock).mockReturnValue('user-id');
            repository.getUserApiKeys.mockResolvedValue([
                {
                    id: 'key-id',
                    apiKey: 'enc-ABCD1234567890',
                    exchange: Exchanges.BYBIT,
                    apiKeyName: 'Main',
                    connectionStatus: 'CONNECTED',
                    market: MarketTypes.FUTURES,
                } as AwaitedReturn<ReturnType<ApiKeysRepositoryService['getUserApiKeys']>>[number],
            ]);

            const result = await service.getUserApiKeys(request);

            expect(encryptService.decrypt).toHaveBeenCalledWith('enc-ABCD1234567890');
            expect(result[0]).toMatchObject({ apiKey: '***7890' });
        });

        it('throws Unauthorized when token is missing', async () => {
            (getUserIdFromToken as jest.Mock).mockReturnValue(null);

            await expect(service.getUserApiKeys(request)).rejects.toBeInstanceOf(
                UnauthorizedException,
            );
        });

        it('raises InternalServerErrorException when repository fails', async () => {
            (getUserIdFromToken as jest.Mock).mockReturnValue('user-id');
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
            expect(encryptService.decrypt).toHaveBeenCalledTimes(2);
        });

        it('returns null when repository does not find record', async () => {
            repository.getUserApiKeyById.mockResolvedValue(null);

            const result = await service.getActiveUserApiCredentials('missing');

            expect(result).toBeNull();
        });
    });
});
