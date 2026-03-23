import { CreateTradingAccountDto } from '@/module-trading-account/dto/create-trading-account.dto';
import { EXCHANGES, MARKET_TYPES } from '@/module-api-keys/enums/api-keys-enums';

let tradingSeq = 1;

export const buildTradingAccountDto = (
    overrides: Partial<CreateTradingAccountDto> = {},
): CreateTradingAccountDto => ({
    tradingAccountName: overrides.tradingAccountName ?? `Account ${tradingSeq++}`,
    apiKeyId: overrides.apiKeyId ?? '118d866c-048f-4710-be77-a9ab672456c4',
    exchange: overrides.exchange ?? EXCHANGES.BYBIT,
    market: overrides.market ?? MARKET_TYPES.FUTURES,
});
