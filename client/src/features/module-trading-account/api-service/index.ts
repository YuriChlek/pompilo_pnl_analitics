import {
    TradingAccountDetails,
    TradingAccountRecentTradePage,
    TradingAccount,
    TradingAccountPayload,
    TradingAccountService,
} from '@/features/module-trading-account/interfaces/trading-account.interfaces';
import { HttpResponse, apiClient } from '@/lib/http-client';
import type { TradingAccountAnalyticsPeriod } from '@/features/module-trading-account/types/analytics-period.types';

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

        if (!response.data) {
            throw new Error('Failed to remove trading account');
        }

        return response.data.removed;
    },
    async getTradingAccountDetails(id: string, period: TradingAccountAnalyticsPeriod) {
        const response: HttpResponse<TradingAccountDetails> = await apiClient.get(
            `/customer/trading-account/${id}`,
            {
                params: {
                    period,
                },
            },
        );

        if (!response.success) {
            throw new Error(response.message);
        }

        return response.data as unknown as TradingAccountDetails;
    },
    async getTradingAccountTrades(
        id: string,
        page: number,
        pageSize: number,
        period: TradingAccountAnalyticsPeriod,
    ) {
        const response: HttpResponse<TradingAccountRecentTradePage> = await apiClient.get(
            `/customer/trading-account/${id}/trades`,
            {
                params: {
                    period,
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
