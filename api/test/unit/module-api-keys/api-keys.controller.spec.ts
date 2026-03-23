import type { Request } from 'express';
import { ApiKeysController } from '@/module-api-keys/api-keys.controller';
import { ApiKeysService } from '@/module-api-keys/services/api-keys.service';
import { CreateApiKeyDto } from '@/module-api-keys/dto/create-api-key.dto';
import { UpdateApiKeyDto } from '@/module-api-keys/dto/update-api-key.dto';

type AwaitedReturn<T> = T extends Promise<infer R> ? R : T;

describe('ApiKeysController', () => {
    let controller: ApiKeysController;
    let service: jest.Mocked<ApiKeysService>;
    let createMock: jest.MockedFunction<ApiKeysService['create']>;
    let getUserApiKeysMock: jest.MockedFunction<ApiKeysService['getUserApiKeys']>;
    let updateMock: jest.MockedFunction<ApiKeysService['update']>;
    let removeMock: jest.MockedFunction<ApiKeysService['remove']>;

    beforeEach(() => {
        createMock = jest.fn();
        getUserApiKeysMock = jest.fn();
        updateMock = jest.fn();
        removeMock = jest.fn();
        service = {
            create: createMock,
            getUserApiKeys: getUserApiKeysMock,
            update: updateMock,
            remove: removeMock,
        } as jest.Mocked<ApiKeysService>;

        controller = new ApiKeysController(service);
        jest.clearAllMocks();
    });

    it('calls ApiKeysService.create with incoming payload', async () => {
        const req = {} as Request;
        const dto = { apiKey: 'key' } as CreateApiKeyDto;
        createMock.mockResolvedValue(
            'result' as AwaitedReturn<ReturnType<ApiKeysService['create']>>,
        );

        const result = await controller.create(req, dto);

        expect(result).toBe('result');
        expect(createMock).toHaveBeenCalledWith(req, dto);
    });

    it('returns user api keys via service', async () => {
        const req = {} as Request;
        getUserApiKeysMock.mockResolvedValue(
            [] as AwaitedReturn<ReturnType<ApiKeysService['getUserApiKeys']>>,
        );

        const result = await controller.getUserApiKeys(req);

        expect(result).toEqual([]);
        expect(getUserApiKeysMock).toHaveBeenCalledWith(req);
    });

    it('delegates update and remove handlers to the service', async () => {
        const req = {} as Request;

        await controller.update(req, '5', {} as UpdateApiKeyDto);
        expect(updateMock).toHaveBeenCalledWith(req, '5', expect.any(Object));

        await controller.remove('10');
        expect(removeMock).toHaveBeenCalledWith('10');
    });
});
