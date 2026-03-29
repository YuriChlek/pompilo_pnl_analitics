import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiKey, ApiKeyPayload } from '@/features/module-api-keys/interfaces/apiKeys';
import { apiKeysService } from '@/features/module-api-keys/api-service';

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

export const useUpdateApiKey = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: ApiKeyPayload }) =>
            apiKeysService.updateApiKey(id, payload),

        onSuccess: (updatedApiKey: ApiKey | null, variables) => {
            queryClient.setQueryData<ApiKey[]>(['apiKeysList'], old =>
                old
                    ? old.map(item =>
                          item.id === variables.id && updatedApiKey ? updatedApiKey : item,
                      )
                    : updatedApiKey
                      ? [updatedApiKey]
                      : [],
            );
        },

        onError: error => {
            console.log(error.message);
        },
    });
};

export const useRemoveApiKey = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: string) => apiKeysService.removeApiKey(payload),

        onSuccess: (_result, id: string) => {
            queryClient.setQueryData<ApiKey[]>(['apiKeysList'], old =>
                old ? old.filter(item => item.id !== id) : [],
            );
        },

        onError: error => {
            console.log(error.message);
        },
    });
};
