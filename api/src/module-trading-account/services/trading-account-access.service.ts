import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { TokenService } from '@/module-auth-token/services/token.service';
import { getUserIdFromToken } from '@/module-auth/utils/get-user-id-from-token.util';
import { TradingAccountRepositoryService } from '@/module-trading-account/services/trading-account-repository.service';
import { TradingAccountBindingRepositoryService } from '@/module-trading-account/services/trading-account-binding.repository.service';
import { TradingAccount } from '@/module-trading-account/entities/trading-account.entity';
import { ApiKeysService } from '@/module-api-keys/services/api-keys.service';
import { ApiKey } from '@/module-api-keys/entities/api-key.entity';

@Injectable()
export class TradingAccountAccessService {
    constructor(
        private readonly tokenService: TokenService,
        private readonly tradingAccountRepositoryService: TradingAccountRepositoryService,
        private readonly tradingAccountBindingRepositoryService: TradingAccountBindingRepositoryService,
        private readonly apiKeysService: ApiKeysService,
    ) {}

    getAuthorizedUserId(request: Request): string {
        const userId = getUserIdFromToken(request, this.tokenService);

        if (!userId) {
            throw new UnauthorizedException('Invalid or missing user.');
        }

        return userId;
    }

    async getOwnedTradingAccount(tradingAccountId: string, userId: string): Promise<TradingAccount> {
        const tradingAccount =
            await this.tradingAccountRepositoryService.findTradingAccountById(tradingAccountId);

        if (!tradingAccount) {
            throw new NotFoundException('Trading account not found.');
        }

        if (tradingAccount.userId !== userId) {
            throw new UnauthorizedException('Invalid or missing user.');
        }

        return tradingAccount;
    }

    async getOwnedActiveApiKey(userId: string, apiKeyId: string): Promise<ApiKey | null> {
        const apiKeyData = await this.apiKeysService.getActiveUserApiCredentials(apiKeyId);

        if (!apiKeyData) {
            return null;
        }

        if (apiKeyData.userId !== userId) {
            throw new UnauthorizedException('Invalid or missing user.');
        }

        return apiKeyData;
    }

    async getRequiredOwnedActiveApiKey(userId: string, apiKeyId: string): Promise<ApiKey> {
        const apiKeyData = await this.getOwnedActiveApiKey(userId, apiKeyId);

        if (!apiKeyData) {
            throw new BadRequestException('Provided API key is not active.');
        }

        return apiKeyData;
    }

    async ensureApiKeyIsAvailable(apiKeyId: string, tradingAccountId?: string): Promise<void> {
        const existingBindingByApiKey =
            await this.tradingAccountBindingRepositoryService.findTradingAccountBindingByApiKeyId(
                apiKeyId,
            );

        if (
            existingBindingByApiKey &&
            existingBindingByApiKey.tradingAccountId !== tradingAccountId
        ) {
            throw new ConflictException('API key is already linked to another trading account.');
        }
    }
}
