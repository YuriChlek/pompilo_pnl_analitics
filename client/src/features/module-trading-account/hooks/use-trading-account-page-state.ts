'use client';

import { startTransition, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
    DEFAULT_TRADING_ACCOUNT_ANALYTICS_PERIOD,
    TRADING_ACCOUNT_ANALYTICS_PERIOD_VALUES,
} from '@/features/module-trading-account/constants/analytics-periods';
import type { TradingAccountAnalyticsPeriod } from '@/features/module-trading-account/interfaces/tradingAccount';

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const PERIOD_PARAM = 'period';
const TRADES_PAGE_PARAM = 'tradesPage';
const TRADES_PAGE_SIZE_PARAM = 'tradesPageSize';

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

    const page = Math.max(
        DEFAULT_PAGE,
        Number(searchParams.get(TRADES_PAGE_PARAM) ?? String(DEFAULT_PAGE)) || DEFAULT_PAGE,
    );
    const requestedPageSizeParam = Number(
        searchParams.get(TRADES_PAGE_SIZE_PARAM) ?? String(DEFAULT_PAGE_SIZE),
    );
    const pageSize = PAGE_SIZE_OPTIONS.includes(requestedPageSizeParam as 10 | 25 | 50)
        ? requestedPageSizeParam
        : DEFAULT_PAGE_SIZE;

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

                params.delete(TRADES_PAGE_PARAM);
            });
        },
        [updateState],
    );

    const setPage = useCallback(
        (nextPage: number) => {
            updateState(params => {
                if (nextPage === DEFAULT_PAGE) {
                    params.delete(TRADES_PAGE_PARAM);
                } else {
                    params.set(TRADES_PAGE_PARAM, String(nextPage));
                }
            });
        },
        [updateState],
    );

    const setPageSize = useCallback(
        (nextPageSize: number) => {
            updateState(params => {
                params.delete(TRADES_PAGE_PARAM);

                if (nextPageSize === DEFAULT_PAGE_SIZE) {
                    params.delete(TRADES_PAGE_SIZE_PARAM);
                } else {
                    params.set(TRADES_PAGE_SIZE_PARAM, String(nextPageSize));
                }
            });
        },
        [updateState],
    );

    return {
        period,
        page,
        pageSize,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
        setPeriod,
        setPage,
        setPageSize,
    };
};
