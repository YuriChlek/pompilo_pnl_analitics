import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tradingAccountService } from '@/features/module-trading-account/api-service';
import {
    TradingAccount,
    TradingAccountPayload,
} from '@/features/module-trading-account/interfaces/tradingAccount';

export const useTradingAccountList = () => {
    return useQuery<TradingAccount[]>({
        queryKey: ['tradingAccountsList'],
        queryFn: (): Promise<TradingAccount[]> => tradingAccountService.getTradingAccountList(),
        gcTime: 300000,
        refetchInterval: 10000,
    });
};

export const useCreateTradingAccount = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: TradingAccountPayload) =>
            tradingAccountService.createTradingAccount(payload),
        onSuccess: newTradingAccount => {
            queryClient.setQueryData<TradingAccount[]>(['tradingAccountsList'], old =>
                old ? [...old, newTradingAccount] : [newTradingAccount],
            );
        },
        onError: error => {
            console.log(error.message);
        },
    });
};
