import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { ApiKeysService } from '@/module-api-keys/services/api-keys.service';
import { TokenService } from '@/module-auth-token/services/token.service';
import { EncryptService } from '@/module-encrypt/services/encrypt.service';
import { ApiKeysRepositoryService } from '@/module-api-keys/services/api-keys.repository.service';
import { ApiKeysValidationService } from '@/module-api-keys/services/api-keys-validation.service';
import { CreateApiKeyDto } from '@/module-api-keys/dto/create-api-key.dto';
import { Exchanges, MarketTypes } from '@/module-api-keys/enums';
import { ApiKey } from '@/module-api-keys/entities/api-key.entity';
import { getUserIdFromToken } from '@/common/utils/get-user-id-from-tocken';

jest.mock('@/common/utils/get-user-id-from-tocken', () => ({
    getUserIdFromToken: jest.fn(),
}));

describe('ApiKeysService', () => {
    let service: ApiKeysService;
    let tokenService: jest.Mocked<TokenService>;
    let encryptService: jest.Mocked<EncryptService>;
    let repository: jest.Mocked<ApiKeysRepositoryService>;
    let validationService: jest.Mocked<ApiKeysValidationService>;
    const request = { cookies: {} } as Request;

    const apiKeyDto: CreateApiKeyDto = {
        apiKey: 'ABCD1234567890',
        secretKey: 'SECRET',
        exchange: Exchanges.BYBIT,
        apiKeyName: 'Main',
        market: MarketTypes.FUTURES,
    } as CreateApiKeyDto;

    beforeEach(() => {
        tokenService = {
            verifyToken: jest.fn(),
        } as unknown as jest.Mocked<TokenService>;

        encryptService = {
            encrypt: jest.fn((value: string) => `enc-${value}`),
            decrypt: jest.fn(value => value.replace('enc-', '')),
        } as unknown as jest.Mocked<EncryptService>;

        repository = {
            saveApiKey: jest.fn(),
            getUserApiKeys: jest.fn(),
            getUserApiKeyById: jest.fn(),
        } as unknown as jest.Mocked<ApiKeysRepositoryService>;

        validationService = {
            validate: jest.fn(),
        } as unknown as jest.Mocked<ApiKeysValidationService>;

        service = new ApiKeysService(tokenService, encryptService, repository, validationService);
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
            } as ApiKey);

            const result = await service.create(request, apiKeyDto);

            expect(validationService.validate).toHaveBeenCalledWith(
                apiKeyDto.apiKey,
                apiKeyDto.secretKey,
                apiKeyDto.exchange,
            );
            expect(repository.saveApiKey).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'user-id',
                    apiKey: 'enc-ABCD1234567890',
                    secretKey: 'enc-SECRET',
                }),
            );
            expect(result).toMatchObject({
                id: 'key-id',
                apiKey: '***7890',
                exchangeUserAccountId: 'uid',
            });
        });

        it('throws UnauthorizedException when user is missing', async () => {
            (getUserIdFromToken as jest.Mock).mockReturnValue(null);

            await expect(service.create(request, apiKeyDto)).rejects.toBeInstanceOf(
                UnauthorizedException,
            );
        });

        it('throws when validation fails', async () => {
            (getUserIdFromToken as jest.Mock).mockReturnValue('user-id');
            validationService.validate.mockResolvedValue({
                valid: false,
                exchangeUserAccountId: null,
            });

            await expect(service.create(request, apiKeyDto)).rejects.toBeInstanceOf(
                UnauthorizedException,
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
                } as ApiKey,
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
    });

    describe('getActiveUserApiCredentials', () => {
        it('returns decrypted credentials when found', async () => {
            repository.getUserApiKeyById.mockResolvedValue({
                id: 'key-id',
                apiKey: 'enc-ABCD',
                secretKey: 'enc-SECRET',
            } as ApiKey);

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
