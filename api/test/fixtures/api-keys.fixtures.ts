import { EXCHANGES, MARKET_TYPES } from '@/module-api-keys/enums/api-keys.enums';
import { CreateApiKeyDto } from '@/module-api-keys/dto/create-api-key.dto';

let apiKeySeq = 1000;

export const buildCreateApiKeyDto = (
    overrides: Partial<CreateApiKeyDto> = {},
): CreateApiKeyDto => ({
    apiKey: overrides.apiKey ?? `APIKEY${apiKeySeq++}`,
    secretKey: overrides.secretKey ?? 'SECRET123456',
    exchange: overrides.exchange ?? EXCHANGES.BYBIT,
    market: overrides.market ?? MARKET_TYPES.FUTURES,
    apiKeyName: overrides.apiKeyName ?? 'Primary',
});
