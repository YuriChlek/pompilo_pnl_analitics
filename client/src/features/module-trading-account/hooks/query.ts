import { useQuery } from '@tanstack/react-query';
import { TradingAccount } from '@/features/module-trading-account/interfaces/tradingAccount';
import { tradingAccountService } from '@/features/module-trading-account/api-service';

export const useTradingAccountList = () => {
    return useQuery<TradingAccount[]>({
        queryKey: ['tradingAccountsList'],
        queryFn: (): Promise<TradingAccount[]> => tradingAccountService.getTradingAccountList(),
        gcTime: 300000,
        refetchInterval: 10000,
    });
};
