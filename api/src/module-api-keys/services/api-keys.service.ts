import {
    BadRequestException,
    HttpException,
    Injectable,
    InternalServerErrorException,
    UnauthorizedException,
} from '@nestjs/common';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';
import { UpdateApiKeyDto } from '../dto/update-api-key.dto';
import type { Request } from 'express';
import { TokenService } from '@/module-auth-token/services/token.service';
import { getUserIdFromToken } from '@/common/utils/get-user-id-from-tocken';
import { ApiKeysRepositoryService } from '@/module-api-keys/services/api-keys.repository.service';
import { EncryptService } from '@/module-encrypt/services/encrypt.service';
import { ApiKey } from '@/module-api-keys/entities/api-key.entity';
import { ApiKeysValidationService } from '@/module-api-keys/services/api-keys-validation.service';

@Injectable()
export class ApiKeysService {
    constructor(
        private readonly tokenService: TokenService,
        private readonly encryptService: EncryptService,
        private readonly apiKeysRepositoryService: ApiKeysRepositoryService,
        private readonly apiKeysValidationService: ApiKeysValidationService,
    ) {}

    async create(request: Request, createApiKeyDto: CreateApiKeyDto) {
        try {
            const userId = getUserIdFromToken(request, this.tokenService);

            if (!userId) {
                throw new UnauthorizedException('Invalid or missing user.');
            }

            const { apiKey, secretKey, exchange, apiKeyName, market } = createApiKeyDto;
            const validationData = await this.apiKeysValidationService.validate(
                apiKey,
                secretKey,
                exchange,
            );

            if (!validationData || !validationData.valid) {
                throw new BadRequestException('Api key validation failed.');
            }

            const encryptedApiKey = this.encryptService.encrypt(apiKey);
            const encryptedSecretKey = this.encryptService.encrypt(secretKey);

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

            return {
                id: data.id,
                apiKey: this.maskApiKey(apiKey),
                exchange: data.exchange,
                apiKeyName: data.apiKeyName,
                connectionStatus: data.connectionStatus,
                market: data.market,
                exchangeUserAccountId: validationData?.exchangeUserAccountId,
            };
        } catch (error) {
            this.handleUnexpectedError(error, 'Failed to create API key');
        }
    }

    async getUserApiKeys(request: Request): Promise<ApiKey[]> {
        try {
            const userId = getUserIdFromToken(request, this.tokenService);
            if (userId) {
                const apiKeysData: ApiKey[] =
                    await this.apiKeysRepositoryService.getUserApiKeys(userId);

                return apiKeysData.map(item => {
                    const apiKey = this.encryptService.decrypt(item.apiKey);

                    item.apiKey = this.maskApiKey(apiKey);

                    return item;
                });
            }

            throw new UnauthorizedException('Invalid or missing user.');
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

        return {
            ...result,
            apiKey: this.encryptService.decrypt(result.apiKey),
            secretKey: this.encryptService.decrypt(result.secretKey),
        };
    }

    update(id: number, updateApiKeyDto: UpdateApiKeyDto) {
        console.log(updateApiKeyDto);
        return `This action updates a #${id} apiKey`;
    }

    remove(id: number) {
        return `This action removes a #${id} apiKey`;
    }

    private maskApiKey(apiKey: string): string {
        if (!apiKey) return '';

        const visiblePart = apiKey.slice(-4);

        return `***${visiblePart}`;
    }

    private handleUnexpectedError(error: unknown, message: string): never {
        if (error instanceof HttpException) {
            throw error;
        }

        throw new InternalServerErrorException(message);
    }
}
