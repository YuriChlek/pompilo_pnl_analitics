import { ApiKeysValidationService } from '@/module-api-keys/services/api-keys-validation.service';
import { BybitService } from '@/module-bybit/services/bybit.service';
import { Exchanges } from '@/module-api-keys/enums';

const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

describe('ApiKeysValidationService', () => {
    let service: ApiKeysValidationService;
    let bybitService: jest.Mocked<BybitService>;

    beforeEach(() => {
        bybitService = {
            validateApiKey: jest
                .fn()
                .mockResolvedValue({ valid: true, exchangeUserAccountId: '1' }),
        } as unknown as jest.Mocked<BybitService>;
        service = new ApiKeysValidationService(bybitService);
    });

    it('delegates Bybit checks to BybitService', async () => {
        await service.validate('key', 'secret', Exchanges.BYBIT);
        await service.validate('key', 'secret', Exchanges.BYBIT_DEMO);

        expect(bybitService.validateApiKey).toHaveBeenNthCalledWith(
            1,
            Exchanges.BYBIT,
            'key',
            'secret',
        );
        expect(bybitService.validateApiKey).toHaveBeenNthCalledWith(
            2,
            Exchanges.BYBIT_DEMO,
            'key',
            'secret',
        );
    });

    it('returns default invalid response for unsupported exchanges', async () => {
        const result = await service.validate('key', 'secret', Exchanges.BINANCE);

        expect(result).toEqual({ valid: false, exchangeUserAccountId: null });
    });
});

afterAll(() => {
    consoleSpy.mockRestore();
});
