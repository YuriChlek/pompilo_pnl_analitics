import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TradingList } from '@/features/module-trading-account/components/trading-list/TradingList';
import {
    configureNextNavigationMock,
    getNextNavigationMockState,
    getNextNavigationSearchParams,
} from '@/tests/test-utils/mock-next-navigation';
import type { TradingAccountRecentTradePage } from '@/features/module-trading-account/interfaces/tradingAccount';
import { buildPagedTradeData } from '@/tests/fixtures/trading-account';

vi.mock('@/features/module-trading-account/hooks/query', () => ({
    useTradingAccountTrades: vi.fn(
        (
            _id: string,
            page: number,
            pageSize: number,
            period: 'all' | '7d' | '30d' | '90d' | '180d',
        ): {
            data: TradingAccountRecentTradePage;
            isLoading: false;
            isFetching: false;
            isPlaceholderData: false;
            isError: false;
            error: null;
        } => ({
            data: buildPagedTradeData(period, page, pageSize),
            isLoading: false,
            isFetching: false,
            isPlaceholderData: false,
            isError: false,
            error: null,
        }),
    ),
}));

describe('TradingList', () => {
    beforeEach(() => {
        configureNextNavigationMock({
            pathname: '/customer/trading-account/account-id',
            search: 'period=7d',
        });
    });

    it('updates rendered rows and query state when moving to next page', async () => {
        const user = userEvent.setup();

        render(<TradingList tradingAccountId="account-id" period="7d" />);

        expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
        expect(screen.queryByText('ETHUSDT')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Next' }));

        expect(getNextNavigationMockState().replace).toHaveBeenCalled();
        expect(getNextNavigationSearchParams().get('period')).toBe('7d');
        expect(getNextNavigationSearchParams().get('tradesPage')).toBe('2');
        expect(screen.getByText('ETHUSDT')).toBeInTheDocument();
        expect(screen.queryByText('BTCUSDT')).not.toBeInTheDocument();
        expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    });

    it('keeps current period while paginating', async () => {
        const user = userEvent.setup();

        configureNextNavigationMock({
            pathname: '/customer/trading-account/account-id',
            search: 'period=90d',
        });

        render(<TradingList tradingAccountId="account-id" period="90d" />);

        await user.click(screen.getByRole('button', { name: 'Next' }));

        expect(getNextNavigationSearchParams().get('period')).toBe('90d');
        expect(within(screen.getByRole('table')).getByText('ETHUSDT')).toBeInTheDocument();
    });
});
