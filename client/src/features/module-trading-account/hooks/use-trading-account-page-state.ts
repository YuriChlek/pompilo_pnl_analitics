'use client';

import { startTransition, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
    DEFAULT_TRADING_ACCOUNT_ANALYTICS_PERIOD,
    TRADING_ACCOUNT_ANALYTICS_PERIOD_VALUES,
} from '@/features/module-trading-account/constants/analytics-periods';
import type { TradingAccountAnalyticsPeriod } from '@/features/module-trading-account/interfaces/tradingAccount';

const PERIOD_PARAM = 'period';

export const useTradingAccountPageState = () => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const requestedPeriod = searchParams.get(PERIOD_PARAM);
    const period = TRADING_ACCOUNT_ANALYTICS_PERIOD_VALUES.includes(
        requestedPeriod as TradingAccountAnalyticsPeriod,
    )
        ? (requestedPeriod as TradingAccountAnalyticsPeriod)
        : DEFAULT_TRADING_ACCOUNT_ANALYTICS_PERIOD;

    const updateState = useCallback(
        (updater: (params: URLSearchParams) => void) => {
            const params = new URLSearchParams(searchParams.toString());

            updater(params);

            const nextQuery = params.toString();
            const currentQuery = searchParams.toString();

            if (nextQuery === currentQuery) {
                return;
            }

            startTransition(() => {
                const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

                router.replace(nextUrl, { scroll: false });
            });
        },
        [pathname, router, searchParams],
    );

    const setPeriod = useCallback(
        (nextPeriod: TradingAccountAnalyticsPeriod) => {
            updateState(params => {
                if (nextPeriod === DEFAULT_TRADING_ACCOUNT_ANALYTICS_PERIOD) {
                    params.delete(PERIOD_PARAM);
                } else {
                    params.set(PERIOD_PARAM, nextPeriod);
                }
            });
        },
        [updateState],
    );

    return {
        period,
        setPeriod,
    };
};
