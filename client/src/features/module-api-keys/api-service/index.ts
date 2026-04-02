import { apiClient } from '@/lib/http-client';
import {
    ApiKey,
    ApiKeyPayload,
    AuthApiKeys,
} from '@/features/module-api-keys/interfaces/api-keys.interfaces';
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
    async updateApiKey(id: string, apiKeyPayload: ApiKeyPayload): Promise<ApiKey | null> {
        const response: HttpResponse<ApiKey> = await apiClient.patch<ApiKey, ApiKeyPayload>(
            `/customer/api-key/update/${id}`,
            apiKeyPayload,
        );

        if (!response.success) {
            throw new Error(response.message);
        }

        return response.data as unknown as ApiKey;
    },
    async removeApiKey(id: string): Promise<boolean> {
        const response: HttpResponse<{ removed: boolean }> = await apiClient.delete<{
            removed: boolean;
        }>(`/customer/api-key/remove/${id}`);

        if (!response.success || !response.data) {
            throw new Error(response.message ?? 'Failed to remove API key');
        }

        return response.data.removed;
    },
};
