'use client';

import { startTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

export const useTradePagination = () => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const requestedPage = Math.max(
        DEFAULT_PAGE,
        Number(searchParams.get('tradesPage') ?? String(DEFAULT_PAGE)) || DEFAULT_PAGE,
    );
    const requestedPageSizeParam = Number(
        searchParams.get('tradesPageSize') ?? String(DEFAULT_PAGE_SIZE),
    );
    const requestedPageSize = PAGE_SIZE_OPTIONS.includes(requestedPageSizeParam as 10 | 25 | 50)
        ? requestedPageSizeParam
        : DEFAULT_PAGE_SIZE;

    const updateTradePagination = (nextPage: number, nextPageSize: number) => {
        const params = new URLSearchParams(searchParams.toString());

        if (nextPage === DEFAULT_PAGE) {
            params.delete('tradesPage');
        } else {
            params.set('tradesPage', String(nextPage));
        }

        if (nextPageSize === DEFAULT_PAGE_SIZE) {
            params.delete('tradesPageSize');
        } else {
            params.set('tradesPageSize', String(nextPageSize));
        }

        startTransition(() => {
            const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;

            router.replace(nextUrl, { scroll: false });
        });
    };

    return {
        page: requestedPage,
        pageSize: requestedPageSize,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
        setPage: (nextPage: number) => updateTradePagination(nextPage, requestedPageSize),
        setPageSize: (nextPageSize: number) => updateTradePagination(DEFAULT_PAGE, nextPageSize),
    };
};
