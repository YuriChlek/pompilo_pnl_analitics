import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TradingAccountDetails } from '@/features/module-trading-account/components/trading-account-details/TradingAccountDetails';
import { renderWithQueryClient } from '@/tests/test-utils/render';
import {
    configureNextNavigationMock,
    getNextNavigationMockState,
    getNextNavigationSearchParams,
} from '@/tests/test-utils/mock-next-navigation';
import * as tradingAccountQueryHooks from '@/features/module-trading-account/hooks/query';
import { buildRecentTradePage, buildTradingAccountDetails } from '@/tests/fixtures/trading-account';

vi.mock('@/features/module-trading-account/hooks/query', () => ({
    useTradingAccountDetails: vi.fn(() => ({
        data: buildTradingAccountDetails(),
        isLoading: false,
        isError: false,
        error: null,
    })),
    useTradingAccountTrades: vi.fn(() => ({
        data: buildRecentTradePage({
            totalItems: 12,
            totalPages: 2,
        }),
        isLoading: false,
        isFetching: false,
        isPlaceholderData: false,
        isError: false,
        error: null,
    })),
}));

vi.mock('@/lib/charts/LazyLineChart', () => ({
    LazyLineChart: () => <div>chart</div>,
}));

describe('TradingAccountDetails', () => {
    beforeEach(() => {
        configureNextNavigationMock({
            pathname: '/customer/trading-account/account-id',
            search: 'period=30d&tradesPage=2',
        });
    });

    it('uses the period from URL and updates URL when a new period is selected', async () => {
        const user = userEvent.setup();
        const useTradingAccountDetailsSpy = vi.mocked(
            tradingAccountQueryHooks.useTradingAccountDetails,
        );

        renderWithQueryClient(<TradingAccountDetails id="account-id" />);

        expect(useTradingAccountDetailsSpy).toHaveBeenCalledWith('account-id', '30d');
        expect(screen.getByRole('button', { name: '30d' })).toHaveAttribute('aria-pressed', 'true');

        await user.click(screen.getByRole('button', { name: '7d' }));

        expect(getNextNavigationMockState().replace).toHaveBeenCalledWith(
            expect.stringContaining('/customer/trading-account/account-id?'),
            { scroll: false },
        );
        expect(getNextNavigationSearchParams().get('period')).toBe('7d');
        expect(getNextNavigationSearchParams().get('tradesPage')).toBe('2');
    });
});
