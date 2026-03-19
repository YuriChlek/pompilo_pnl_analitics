import { apiClient } from '@/lib/http-client/http-client';
import { ApiKey, ApiKeyPayload, AuthApiKeys } from '@/features/module-api-keys/interfaces/apiKeys';
import { HttpResponse } from '@/lib/http-client';

export const apiKeysService: AuthApiKeys = {
    async createApiKey(apiKeyPayload: ApiKeyPayload): Promise<ApiKey> {
        const response: HttpResponse<ApiKey> = await apiClient.post<ApiKey, ApiKeyPayload>(
            '/customer/api-key/create',
            apiKeyPayload,
        );

        if (!response.success) {
            throw new Error(response.message);
        }

        return response.data as unknown as ApiKey;
    },
    async getUserApiKeys(): Promise<ApiKey[]> {
        const response: HttpResponse<ApiKey[]> = await apiClient.post<ApiKey[], null>(
            '/customer/api-key/user-api-keys',
            null,
        );

        if (!response.success) {
            throw new Error(response.message);
        }

        return response.data as unknown as ApiKey[];
    },
    async updateApiKey(id: string, apiKey: string, publicKey: string): Promise<ApiKey | null> {

        return null;
    },
    async removeApiKey(id: string): Promise<boolean | null> {
        const response: HttpResponse<{removed: boolean}> = await apiClient.delete<{removed: boolean}>(
            `/customer/api-key/remove/${id}`,
        );

        return response.data?.removed as unknown as boolean;
    },
};
