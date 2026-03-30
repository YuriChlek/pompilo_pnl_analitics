import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
    TradingAccount,
    TradingAccountDetails,
    TradingAccountRecentTradePage,
} from '@/features/module-trading-account/interfaces/tradingAccount';
import { tradingAccountService } from '@/features/module-trading-account/api-service';
import { useApiKeysList } from '@/features/module-api-keys/hooks/query';
import { ApiKey } from '@/features/module-api-keys/interfaces/apiKeys';

export const useTradingAccountList = () => {
    return useQuery<TradingAccount[]>({
        queryKey: ['tradingAccountsList'],
        queryFn: (): Promise<TradingAccount[]> => tradingAccountService.getTradingAccountList(),
        gcTime: 300000,
        staleTime: 300000,
    });
};

export const useTradingAccountDetails = (id: string) => {
    return useQuery<TradingAccountDetails>({
        queryKey: ['tradingAccountDetails', id],
        queryFn: (): Promise<TradingAccountDetails> =>
            tradingAccountService.getTradingAccountDetails(id),
        enabled: Boolean(id),
        staleTime: 300000,
        gcTime: 300000,
    });
};

export const useTradingAccountTrades = (id: string, page: number, pageSize: number) => {
    return useQuery<TradingAccountRecentTradePage>({
        queryKey: ['tradingAccountTrades', id, page, pageSize],
        queryFn: (): Promise<TradingAccountRecentTradePage> =>
            tradingAccountService.getTradingAccountTrades(id, page, pageSize),
        enabled: Boolean(id),
        staleTime: 300000,
        gcTime: 300000,
        placeholderData: keepPreviousData,
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
