import { useMemo, useSyncExternalStore } from 'react';
import { vi } from 'vitest';

type RouterMockState = {
    pathname: string;
    search: string;
    replace: ReturnType<typeof vi.fn>;
};

const routerState: RouterMockState = {
    pathname: '/customer/trading-account/account-id',
    search: '',
    replace: vi.fn((url: string) => {
        const parsed = new URL(url, 'http://localhost');

        routerState.pathname = parsed.pathname;
        routerState.search = parsed.search;
        listeners.forEach(listener => listener());
    }),
};

const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
    listeners.add(listener);

    return () => listeners.delete(listener);
};

export const configureNextNavigationMock = ({
    pathname,
    search = '',
}: {
    pathname?: string;
    search?: string;
}) => {
    if (pathname) {
        routerState.pathname = pathname;
    }

    routerState.search = search;
    routerState.replace.mockClear();
    listeners.forEach(listener => listener());
};

export const getNextNavigationMockState = () => routerState;

export const getNextNavigationSearchParams = () => new URLSearchParams(routerState.search);

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        replace: routerState.replace,
    }),
    usePathname: () => useSyncExternalStore(subscribe, () => routerState.pathname),
    useSearchParams: () => {
        const search = useSyncExternalStore(subscribe, () => routerState.search);

        return useMemo(() => new URLSearchParams(search), [search]);
    },
}));
