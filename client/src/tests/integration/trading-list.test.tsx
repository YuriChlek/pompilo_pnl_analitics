import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TradingList } from '@/features/module-trading-account/components/trading-list/trading-list';
import type { TradingAccountRecentTradePage } from '@/features/module-trading-account/interfaces/trading-account.interfaces';
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
    it('updates rendered rows when moving to next page', async () => {
        const user = userEvent.setup();

        render(<TradingList tradingAccountId="account-id" period="7d" />);

        expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
        expect(screen.queryByText('ETHUSDT')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Next' }));

        expect(screen.getByText('ETHUSDT')).toBeInTheDocument();
        expect(screen.queryByText('BTCUSDT')).not.toBeInTheDocument();
        expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    });

    it('keeps current period while paginating', async () => {
        const user = userEvent.setup();

        render(<TradingList tradingAccountId="account-id" period="90d" />);

        await user.click(screen.getByRole('button', { name: 'Next' }));

        expect(within(screen.getByRole('table')).getByText('ETHUSDT')).toBeInTheDocument();
    });

    it('expands trade details inline when view action is clicked', async () => {
        const user = userEvent.setup();

        render(<TradingList tradingAccountId="account-id" period="7d" />);

        const toggleButton = screen.getByRole('button', { name: 'View BTCUSDT trade details' });

        await user.click(toggleButton);

        expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('Realtime Candlestick Chart')).toBeInTheDocument();
        expect(screen.getByLabelText('Description')).toBeInTheDocument();
        expect(screen.getByLabelText('Conclusion')).toBeInTheDocument();
        expect(screen.getByLabelText('Add image')).toBeInTheDocument();
    });
});
