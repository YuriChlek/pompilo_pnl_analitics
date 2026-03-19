import { Exchanges, MarketTypes } from '@/module-api-keys/enums/api-keys-enums';
import { CreateApiKeyDto } from '@/module-api-keys/dto/create-api-key.dto';

let apiKeySeq = 1000;

export const buildCreateApiKeyDto = (
    overrides: Partial<CreateApiKeyDto> = {},
): CreateApiKeyDto => ({
    apiKey: overrides.apiKey ?? `APIKEY${apiKeySeq++}`,
    secretKey: overrides.secretKey ?? 'SECRET123456',
    exchange: overrides.exchange ?? Exchanges.BYBIT,
    market: overrides.market ?? MarketTypes.FUTURES,
    apiKeyName: overrides.apiKeyName ?? 'Primary',
});
