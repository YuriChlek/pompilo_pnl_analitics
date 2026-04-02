import { useQuery } from '@tanstack/react-query';
import { apiKeysService } from '@/features/module-api-keys/api-service';
import { ApiKey } from '@/features/module-api-keys/interfaces/api-keys.interfaces';

export const useApiKeysList = () => {
    return useQuery<ApiKey[]>({
        queryKey: ['apiKeysList'],
        queryFn: (): Promise<ApiKey[]> => apiKeysService.getUserApiKeys(),
        gcTime: 300000,
        staleTime: 300000,
    });
};
