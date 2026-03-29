import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    TradingAccount,
    TradingAccountPayload,
} from '@/features/module-trading-account/interfaces/tradingAccount';
import { tradingAccountService } from '@/features/module-trading-account/api-service';

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

export const useUpdateTradingAccount = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: TradingAccountPayload }) =>
            tradingAccountService.editTradingAccount(id, payload),

        onSuccess: (updatedTradingAccount: TradingAccount | null, variables) => {
            queryClient.setQueryData<TradingAccount[]>(['tradingAccountsList'], old =>
                old
                    ? old.map(item =>
                          item.id === variables.id && updatedTradingAccount
                              ? updatedTradingAccount
                              : item,
                      )
                    : updatedTradingAccount
                      ? [updatedTradingAccount]
                      : [],
            );
        },
        onError: error => {
            console.log(error.message);
        },
    });
};

export const useRemoveTradingAccount = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => tradingAccountService.removeTradingAccount(id),

        onSuccess: (_result, id: string) => {
            queryClient.setQueryData<TradingAccount[]>(['tradingAccountsList'], old =>
                old ? old.filter(item => item.id !== id) : [],
            );
        },
        onError: error => {
            console.log(error.message);
        },
    });
};
