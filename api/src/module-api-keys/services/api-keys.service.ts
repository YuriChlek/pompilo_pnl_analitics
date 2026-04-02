import {
    BadRequestException,
    HttpException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';
import { UpdateApiKeyDto } from '../dto/update-api-key.dto';
import type { Request } from 'express';
import { ApiKeysRepositoryService } from '@/module-api-keys/services/api-keys.repository.service';
import { ApiKey } from '@/module-api-keys/entities/api-key.entity';
import { ApiKeysValidationService } from '@/module-api-keys/services/api-keys-validation.service';
import { UpdateResult } from 'typeorm';
import { ApiKeysAccessService } from '@/module-api-keys/services/api-keys-access.service';
import { ApiKeysViewService } from '@/module-api-keys/services/api-keys-view.service';

@Injectable()
export class ApiKeysService {
    constructor(
        private readonly apiKeysRepositoryService: ApiKeysRepositoryService,
        private readonly apiKeysValidationService: ApiKeysValidationService,
        private readonly apiKeysAccessService: ApiKeysAccessService,
        private readonly apiKeysViewService: ApiKeysViewService,
    ) {}

    async create(request: Request, createApiKeyDto: CreateApiKeyDto) {
        try {
            const userId = this.apiKeysAccessService.getAuthorizedUserId(request);
            const { apiKey, secretKey, exchange, apiKeyName, market } = createApiKeyDto;
            const validationData = await this.apiKeysValidationService.validate(
                apiKey,
                secretKey,
                exchange,
            );

            if (!validationData || !validationData.valid) {
                throw new BadRequestException('Api key validation failed.');
            }

            const { encryptedApiKey, encryptedSecretKey } =
                this.apiKeysViewService.encryptCredentials(apiKey, secretKey);

            const data: ApiKey = await this.apiKeysRepositoryService.saveApiKey({
                userId,
                exchange,
                apiKeyName,
                market,
                apiKey: encryptedApiKey,
                exchangeUserAccountId: validationData.exchangeUserAccountId,
                secretKey: encryptedSecretKey,
                isActive: true,
            });

            return this.apiKeysViewService.toMaskedApiKeyResponse(
                data,
                apiKey,
                validationData.exchangeUserAccountId,
            );
        } catch (error) {
            this.handleUnexpectedError(error, 'Failed to create API key');
        }
    }

    async getUserApiKeys(request: Request): Promise<ApiKey[]> {
        try {
            const userId = this.apiKeysAccessService.getAuthorizedUserId(request);
            const apiKeysData: ApiKey[] = await this.apiKeysRepositoryService.getUserApiKeys(userId);

            return this.apiKeysViewService.maskApiKeyList(apiKeysData);
        } catch (error: unknown) {
            this.handleUnexpectedError(error, 'Failed to retrieve API keys');
        }
    }

    async getActiveUserApiCredentials(apiKeyId: string): Promise<ApiKey | null> {
        const result: ApiKey | null =
            await this.apiKeysRepositoryService.getUserApiKeyById(apiKeyId);
        if (!result) {
            return null;
        }

        return this.apiKeysViewService.toDecryptedCredentials(result);
    }

    async update(request: Request, apiKeyId: string, updateApiKeyDto: UpdateApiKeyDto) {
        try {
            const userId = this.apiKeysAccessService.getAuthorizedUserId(request);
            const existingApiKey = await this.apiKeysAccessService.getOwnedActiveApiKey(
                apiKeyId,
                userId,
            );

            const { apiKey, secretKey, exchange, apiKeyName, market } = updateApiKeyDto;

            if (!apiKey || !secretKey || !exchange || !apiKeyName || !market) {
                throw new BadRequestException('All API key update fields are required.');
            }

            const validationData = await this.apiKeysValidationService.validate(
                apiKey,
                secretKey,
                exchange,
            );

            if (!validationData || !validationData.valid) {
                throw new BadRequestException('Api key validation failed.');
            }

            const { encryptedApiKey, encryptedSecretKey } =
                this.apiKeysViewService.encryptCredentials(apiKey, secretKey);

            const data: UpdateResult = await this.apiKeysRepositoryService.update(apiKeyId, {
                apiKeyName,
                apiKey: encryptedApiKey,
                secretKey: encryptedSecretKey,
                exchange,
                market: market,
                exchangeUserAccountId: validationData.exchangeUserAccountId,
            });

            if (!data.affected) {
                throw new NotFoundException('API key not found.');
            }

            return this.apiKeysViewService.toMaskedApiKeyResponse(
                {
                    ...existingApiKey,
                    exchange,
                    apiKeyName,
                    market,
                },
                apiKey,
                validationData.exchangeUserAccountId,
            );
        } catch (error) {
            this.handleUnexpectedError(error, 'Failed to update API key');
        }
    }

    async remove(apiKeyId: string): Promise<{ removed: boolean }> {
        try {
            await this.apiKeysRepositoryService.remove(apiKeyId);

            return {
                removed: true,
            };
        } catch (error) {
            this.handleUnexpectedError(error, 'Failed to remove API key');
        }
    }

    private handleUnexpectedError(error: unknown, message: string): never {
        if (error instanceof HttpException) {
            throw error;
        }

        throw new InternalServerErrorException(message);
    }
}
