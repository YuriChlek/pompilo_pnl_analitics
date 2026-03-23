import { ApiKeysValidationService } from '@/module-api-keys/services/api-keys-validation.service';
import { BybitService } from '@/module-bybit/services/bybit.service';
import { EXCHANGES } from '@/module-api-keys/enums/api-keys-enums';

const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

describe('ApiKeysValidationService', () => {
    let service: ApiKeysValidationService;
    let bybitService: {
        validateApiKey: jest.MockedFunction<BybitService['validateApiKey']>;
    };

    beforeEach(() => {
        bybitService = {
            validateApiKey: jest
                .fn()
                .mockResolvedValue({ valid: true, exchangeUserAccountId: '1' }),
        };
        service = new ApiKeysValidationService(bybitService as unknown as BybitService);
    });

    it('delegates Bybit checks to BybitService', async () => {
        await service.validate('key', 'secret', EXCHANGES.BYBIT);
        await service.validate('key', 'secret', EXCHANGES.BYBIT_DEMO);

        expect(bybitService.validateApiKey).toHaveBeenNthCalledWith(
            1,
            EXCHANGES.BYBIT,
            'key',
            'secret',
        );
        expect(bybitService.validateApiKey).toHaveBeenNthCalledWith(
            2,
            EXCHANGES.BYBIT_DEMO,
            'key',
            'secret',
        );
    });

    it('returns default invalid response for unsupported exchanges', async () => {
        const result = await service.validate('key', 'secret', EXCHANGES.BINANCE);

        expect(result).toEqual({ valid: false, exchangeUserAccountId: null });
    });
});

afterAll(() => {
    consoleSpy.mockRestore();
});
