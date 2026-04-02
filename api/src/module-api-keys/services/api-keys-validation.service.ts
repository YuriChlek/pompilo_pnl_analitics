import { Injectable } from '@nestjs/common';
import { BybitService } from '@/module-bybit/services/bybit.service';
import { EXCHANGES } from '@/module-api-keys/enums/api-keys.enums';
import { ApiValidationInterface } from '@/module-api-keys/types/api-keys.types';

@Injectable()
export class ApiKeysValidationService {
    constructor(private readonly bybitService: BybitService) {}

    async validate(
        apiKeyId: string,
        privateKey: string,
        exchange: EXCHANGES,
    ): Promise<ApiValidationInterface | undefined> {
        switch (exchange) {
            case EXCHANGES.BYBIT:
                return await this.validateBybitApiKey(EXCHANGES.BYBIT, apiKeyId, privateKey);
            case EXCHANGES.BYBIT_DEMO:
                return await this.validateBybitApiKey(EXCHANGES.BYBIT_DEMO, apiKeyId, privateKey);
            case EXCHANGES.BINANCE:
                return await this.validateBinanceApiKey(apiKeyId, privateKey);
            default:
                return {
                    valid: false,
                    exchangeUserAccountId: null,
                };
        }
    }

    async validateBybitApiKey(
        exchange: EXCHANGES.BYBIT_DEMO | EXCHANGES.BYBIT,
        apiKey: string,
        privateKey: string,
    ): Promise<ApiValidationInterface | undefined> {
        return await this.bybitService.validateApiKey(exchange, apiKey, privateKey);
    }

    validateBinanceApiKey(apiKeyId: string, privateKey: string): Promise<ApiValidationInterface> {
        console.log(apiKeyId, privateKey);
        return Promise.resolve({
            valid: false,
            exchangeUserAccountId: null,
        });
    }

    validateOKXApiKey(apiKeyId: string, privateKey: string): Promise<ApiValidationInterface> {
        console.log(apiKeyId, privateKey);
        return Promise.resolve({
            valid: false,
            exchangeUserAccountId: null,
        });
    }

    validateHyperLiquidApiKey(
        apiKeyId: string,
        privataKey: string,
    ): Promise<ApiValidationInterface> {
        console.log(apiKeyId, privataKey);
        return Promise.resolve({
            valid: false,
            exchangeUserAccountId: null,
        });
    }
}
