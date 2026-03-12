import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiKeysService } from '@/features/module-api-keys/api-service';
import { ApiKey, ApiKeyPayload } from '@/features/module-api-keys/interfaces/apiKeys';

export const useApiKeysList = () => {
    return useQuery<ApiKey[]>({
        queryKey: ['apiKeysList'],
        queryFn: (): Promise<ApiKey[]> => apiKeysService.getUserApiKeys(),
        gcTime: 300000,
        refetchInterval: 10000,
    });
};

export const useCreateApiKey = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: ApiKeyPayload) => apiKeysService.createApiKey(payload),

        onSuccess: (newApiKey: ApiKey) => {
            queryClient.setQueryData<ApiKey[]>(['apiKeysList'], old =>
                old ? [...old, newApiKey] : [newApiKey],
            );
        },
        onError: error => {
            console.log(error.message);
        },
    });
};
