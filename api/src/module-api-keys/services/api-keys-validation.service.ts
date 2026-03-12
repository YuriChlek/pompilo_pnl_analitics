import { Injectable } from '@nestjs/common';
import { BybitService } from '@/module-bybit/services/bybit.service';
import { Exchanges } from '@/module-api-keys/enums';
import { ApiValidationInterface } from '@/module-api-keys/interfaces/api-keys.interfaces';

@Injectable()
export class ApiKeysValidationService {
    constructor(private readonly bybitService: BybitService) {}

    async validate(
        apiKeyId: string,
        privateKey: string,
        exchange: Exchanges,
    ): Promise<ApiValidationInterface | undefined> {
        switch (exchange) {
            case Exchanges.BYBIT:
                return await this.validateBybitApiKey(Exchanges.BYBIT, apiKeyId, privateKey);
            case Exchanges.BYBIT_DEMO:
                return await this.validateBybitApiKey(Exchanges.BYBIT_DEMO, apiKeyId, privateKey);
            case Exchanges.BINANCE:
                return await this.validateBinanceApiKey(apiKeyId, privateKey);
            default:
                return {
                    valid: false,
                    exchangeUserAccountId: null,
                };
        }
    }

    async validateBybitApiKey(
        exchange: Exchanges.BYBIT_DEMO | Exchanges.BYBIT,
        apiKey: string,
        privateKey: string,
    ): Promise<ApiValidationInterface | undefined> {
        return await this.bybitService.validateApiKey(exchange, apiKey, privateKey);
    }

    async validateBinanceApiKey(
        apiKeyId: string,
        privateKey: string,
    ): Promise<ApiValidationInterface> {
        console.log(apiKeyId, privateKey);
        return {
            valid: false,
            exchangeUserAccountId: null,
        };
    }

    async validateOKXApiKey(apiKeyId: string, privateKey: string): Promise<ApiValidationInterface> {
        console.log(apiKeyId, privateKey);
        return {
            valid: false,
            exchangeUserAccountId: null,
        };
    }

    async validateHyperLiquidApiKey(
        apiKeyId: string,
        privataKey: string,
    ): Promise<ApiValidationInterface> {
        console.log(apiKeyId, privataKey);
        return {
            valid: false,
            exchangeUserAccountId: null,
        };
    }
}
