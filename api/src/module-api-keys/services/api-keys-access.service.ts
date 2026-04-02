import {
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { TokenService } from '@/module-auth-token/services/token.service';
import { getUserIdFromToken } from '@/module-auth/utils/get-user-id-from-token.util';
import { ApiKeysRepositoryService } from '@/module-api-keys/services/api-keys.repository.service';
import { ApiKey } from '@/module-api-keys/entities/api-key.entity';

@Injectable()
export class ApiKeysAccessService {
    constructor(
        private readonly tokenService: TokenService,
        private readonly apiKeysRepositoryService: ApiKeysRepositoryService,
    ) {}

    getAuthorizedUserId(request: Request): string {
        const userId = getUserIdFromToken(request, this.tokenService);

        if (!userId) {
            throw new UnauthorizedException('Invalid or missing user.');
        }

        return userId;
    }

    async getOwnedActiveApiKey(apiKeyId: string, userId: string): Promise<ApiKey> {
        const apiKey = await this.apiKeysRepositoryService.getUserApiKeyById(apiKeyId);

        if (!apiKey) {
            throw new NotFoundException('API key not found.');
        }

        if (apiKey.userId !== userId) {
            throw new UnauthorizedException('Invalid or missing user.');
        }

        return apiKey;
    }
}
