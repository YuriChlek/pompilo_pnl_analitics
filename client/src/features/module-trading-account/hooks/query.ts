import { useQuery } from '@tanstack/react-query';
import { TradingAccount } from '@/features/module-trading-account/interfaces/tradingAccount';
import { tradingAccountService } from '@/features/module-trading-account/api-service';
import { useApiKeysList } from '@/features/module-api-keys/hooks/query';
import { ApiKey } from '@/features/module-api-keys/interfaces/apiKeys';

export const useTradingAccountList = () => {
    return useQuery<TradingAccount[]>({
        queryKey: ['tradingAccountsList'],
        queryFn: (): Promise<TradingAccount[]> => tradingAccountService.getTradingAccountList(),
        gcTime: 300000,
        refetchInterval: 10000,
    });
};

export const useAvailableTradingAccountApiKeys = (currentTradingAccountId?: string): ApiKey[] => {
    const { data: apiKeysList } = useApiKeysList();
    const { data: tradingAccountsList } = useTradingAccountList();
    const usedApiKeyIds = new Set(
        (tradingAccountsList ?? [])
            .filter(account => account.id !== currentTradingAccountId)
            .flatMap(account => (account.apiKeyId ? [account.apiKeyId] : [])),
    );

    return apiKeysList?.filter(apiKey => !usedApiKeyIds.has(apiKey.id)) ?? [];
};
