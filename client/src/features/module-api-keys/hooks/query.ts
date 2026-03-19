import { useQuery } from '@tanstack/react-query';
import { apiKeysService } from '@/features/module-api-keys/api-service';
import { ApiKey } from '@/features/module-api-keys/interfaces/apiKeys';

export const useApiKeysList = () => {
    return useQuery<ApiKey[]>({
        queryKey: ['apiKeysList'],
        queryFn: (): Promise<ApiKey[]> => apiKeysService.getUserApiKeys(),
        gcTime: 300000,
        refetchInterval: 10000,
    });
};
