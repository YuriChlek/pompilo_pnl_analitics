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
