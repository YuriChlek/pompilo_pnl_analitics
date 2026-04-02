import { Injectable } from '@nestjs/common';
import { EncryptService } from '@/module-encrypt/services/encrypt.service';
import { ApiKey } from '@/module-api-keys/entities/api-key.entity';

@Injectable()
export class ApiKeysViewService {
    constructor(private readonly encryptService: EncryptService) {}

    encryptCredentials(apiKey: string, secretKey: string): {
        encryptedApiKey: string;
        encryptedSecretKey: string;
    } {
        return {
            encryptedApiKey: this.encryptService.encrypt(apiKey),
            encryptedSecretKey: this.encryptService.encrypt(secretKey),
        };
    }

    toMaskedApiKeyResponse(
        apiKey: Pick<
            ApiKey,
            'id' | 'exchange' | 'apiKeyName' | 'connectionStatus' | 'market'
        >,
        rawApiKey: string,
        exchangeUserAccountId: string | null,
    ) {
        return {
            id: apiKey.id,
            apiKey: this.maskApiKey(rawApiKey),
            exchange: apiKey.exchange,
            apiKeyName: apiKey.apiKeyName,
            connectionStatus: apiKey.connectionStatus,
            market: apiKey.market,
            exchangeUserAccountId,
        };
    }

    maskApiKeyList(apiKeys: ApiKey[]): ApiKey[] {
        return apiKeys.map(item => ({
            ...item,
            apiKey: this.maskApiKey(this.encryptService.decrypt(item.apiKey)),
        }));
    }

    toDecryptedCredentials(apiKey: ApiKey): ApiKey {
        return {
            ...apiKey,
            apiKey: this.encryptService.decrypt(apiKey.apiKey),
            secretKey: this.encryptService.decrypt(apiKey.secretKey),
        };
    }

    private maskApiKey(apiKey: string): string {
        if (!apiKey) {
            return '';
        }

        return `***${apiKey.slice(-4)}`;
    }
}
