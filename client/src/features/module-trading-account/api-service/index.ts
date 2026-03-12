import {
    TradingAccount,
    TradingAccountPayload,
    TradingAccountService,
} from '@/features/module-trading-account/interfaces/tradingAccount';
import { HttpResponse } from '@/lib/http-client';
import { apiClient } from '@/lib/http-client/http-client';

export const tradingAccountService: TradingAccountService = {
    async createTradingAccount(tradingAccountPayload: TradingAccountPayload) {
        const response: HttpResponse<TradingAccount> = await apiClient.post(
            '/customer/trading-account/create',
            tradingAccountPayload,
        );
        console.log(response);
        return response.data as unknown as TradingAccount;
    },
    async getTradingAccountList(): Promise<TradingAccount[]> {
        const response: HttpResponse<TradingAccount[]> = await apiClient.get(
            '/customer/trading-account',
        );

        return response.data as unknown as TradingAccount[];
    },
    async editTradingAccount(tradingAccountPayload: TradingAccountPayload) {
        return tradingAccountPayload;
    },
    async removeTradingAccount() {},
    async getTradingAccountStatistic() {},
    async getTradingAccountClosedPnL() {},
    async getTradingAccountOpenPnL() {},
};
