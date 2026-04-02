import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
    TradingAccount,
    TradingAccountDetails,
    TradingAccountRecentTradePage,
} from '@/features/module-trading-account/interfaces/trading-account.interfaces';
import { tradingAccountService } from '@/features/module-trading-account/api-service';
import { useApiKeysList } from '@/features/module-api-keys/hooks/query';
import { ApiKey } from '@/features/module-api-keys/interfaces/api-keys.interfaces';
import type { TradingAccountAnalyticsPeriod } from '@/features/module-trading-account/types/analytics-period.types';

export const useTradingAccountList = () => {
    return useQuery<TradingAccount[]>({
        queryKey: ['tradingAccountsList'],
        queryFn: (): Promise<TradingAccount[]> => tradingAccountService.getTradingAccountList(),
        gcTime: 300000,
        staleTime: 300000,
    });
};

export const useTradingAccountDetails = (id: string, period: TradingAccountAnalyticsPeriod) => {
    return useQuery<TradingAccountDetails>({
        queryKey: ['tradingAccountDetails', id, period],
        queryFn: (): Promise<TradingAccountDetails> =>
            tradingAccountService.getTradingAccountDetails(id, period),
        enabled: Boolean(id),
        staleTime: 300000,
        gcTime: 300000,
    });
};

export const useTradingAccountTrades = (
    id: string,
    page: number,
    pageSize: number,
    period: TradingAccountAnalyticsPeriod,
) => {
    return useQuery<TradingAccountRecentTradePage>({
        queryKey: ['tradingAccountTrades', id, period, page, pageSize],
        queryFn: (): Promise<TradingAccountRecentTradePage> =>
            tradingAccountService.getTradingAccountTrades(id, page, pageSize, period),
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
