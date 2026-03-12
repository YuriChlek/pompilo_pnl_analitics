import { ApiKey } from '@/module-api-keys/entities/api-key.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class ApiKeysRepositoryService {
    public constructor(
        @InjectRepository(ApiKey)
        private readonly apiKeysRepository: Repository<ApiKey>,
    ) {}

    async saveApiKey(apiKeyPayload: Partial<ApiKey>): Promise<ApiKey> {
        return await this.apiKeysRepository.save(apiKeyPayload);
    }

    async updateApiKey() {}

    async removeApiKeyBuId() {}

    async getUserExchangeAccountId(apiKeyId: string): Promise<string | null> {
        const record = await this.apiKeysRepository.findOne({
            where: { id: apiKeyId, isActive: true },
            select: ['exchangeUserAccountId'],
        });

        return record?.exchangeUserAccountId ?? null;
    }

    async getUserApiKeyById(apiKeyId: string): Promise<ApiKey | null> {
        const record: ApiKey | null = await this.apiKeysRepository.findOne({
            where: { id: apiKeyId, isActive: true },
            select: [
                'id',
                'userId',
                'apiKey',
                'secretKey',
                'exchange',
                'market',
                'exchangeUserAccountId',
                'apiKeyName',
            ],
        });

        return record ?? null;
    }

    async getUserApiKeys(userId: string): Promise<ApiKey[]> {
        return this.apiKeysRepository.find({
            where: { userId, isActive: true },
            select: {
                id: true,
                apiKey: true,
                exchange: true,
                apiKeyName: true,
                connectionStatus: true,
                market: true,
            },
        });
    }
}
