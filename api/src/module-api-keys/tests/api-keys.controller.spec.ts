import type { Request } from 'express';
import { ApiKeysController } from '@/module-api-keys/api-keys.controller';
import { ApiKeysService } from '@/module-api-keys/services/api-keys.service';
import { CreateApiKeyDto } from '@/module-api-keys/dto/create-api-key.dto';
import { UpdateApiKeyDto } from '@/module-api-keys/dto/update-api-key.dto';

describe('ApiKeysController', () => {
    let controller: ApiKeysController;
    let service: jest.Mocked<ApiKeysService>;

    beforeEach(() => {
        service = {
            create: jest.fn(),
            getUserApiKeys: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
        } as unknown as jest.Mocked<ApiKeysService>;

        controller = new ApiKeysController(service);
        jest.clearAllMocks();
    });

    it('calls ApiKeysService.create with incoming payload', async () => {
        const req = {} as Request;
        const dto = { apiKey: 'key' } as CreateApiKeyDto;
        service.create.mockResolvedValue('result' as never);

        const result = await controller.create(req, dto);

        expect(result).toBe('result');
        expect(service.create).toHaveBeenCalledWith(req, dto);
    });

    it('returns user api keys via service', async () => {
        const req = {} as Request;
        service.getUserApiKeys.mockResolvedValue([] as never);

        const result = await controller.getUserApiKeys(req);

        expect(result).toEqual([]);
        expect(service.getUserApiKeys).toHaveBeenCalledWith(req);
    });

    it('delegates update and remove handlers to the service', () => {
        controller.update('5', {} as UpdateApiKeyDto);
        expect(service.update).toHaveBeenCalledWith(5, expect.any(Object));

        controller.remove('10');
        expect(service.remove).toHaveBeenCalledWith(10);
    });
});
