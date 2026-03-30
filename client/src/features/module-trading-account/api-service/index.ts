import {
    TradingAccountDetails,
    TradingAccountRecentTradePage,
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

        if (!response.success) {
            throw new Error(response.message);
        }

        return response.data as unknown as TradingAccount;
    },
    async getTradingAccountList(): Promise<TradingAccount[]> {
        const response: HttpResponse<TradingAccount[]> = await apiClient.get(
            '/customer/trading-account',
        );

        if (!response.success) {
            throw new Error(response.message);
        }

        return response.data as unknown as TradingAccount[];
    },
    async editTradingAccount(id: string, tradingAccountPayload: TradingAccountPayload) {
        const response: HttpResponse<TradingAccount> = await apiClient.patch(
            `/customer/trading-account/update/${id}`,
            tradingAccountPayload,
        );

        if (!response.success) {
            throw new Error(response.message);
        }

        return response.data as unknown as TradingAccount;
    },
    async removeTradingAccount(id: string) {
        const response: HttpResponse<{ removed: boolean }> = await apiClient.delete(
            `/customer/trading-account/remove/${id}`,
        );

        if (!response.success) {
            throw new Error(response.message);
        }

        return response.data?.removed as unknown as boolean;
    },
    async getTradingAccountDetails(id: string) {
        const response: HttpResponse<TradingAccountDetails> = await apiClient.get(
            `/customer/trading-account/${id}`,
        );

        if (!response.success) {
            throw new Error(response.message);
        }

        return response.data as unknown as TradingAccountDetails;
    },
    async getTradingAccountTrades(id: string, page: number, pageSize: number) {
        const response: HttpResponse<TradingAccountRecentTradePage> = await apiClient.get(
            `/customer/trading-account/${id}/trades`,
            {
                params: {
                    page,
                    pageSize,
                },
            },
        );

        if (!response.success) {
            throw new Error(response.message);
        }

        return response.data as unknown as TradingAccountRecentTradePage;
    },
};
