import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTradingAccountPageState } from '@/features/module-trading-account/hooks/use-trading-account-page-state';
import {
    configureNextNavigationMock,
    getNextNavigationMockState,
    getNextNavigationSearchParams,
} from '@/tests/test-utils/mock-next-navigation';

function HookProbe() {
    const { period, page, pageSize, setPeriod, setPage, setPageSize } =
        useTradingAccountPageState();

    return (
        <div>
            <output data-testid="period">{period}</output>
            <output data-testid="page">{page}</output>
            <output data-testid="pageSize">{pageSize}</output>
            <button type="button" onClick={() => setPeriod('7d')}>
                set-7d
            </button>
            <button type="button" onClick={() => setPeriod('all')}>
                set-all
            </button>
            <button type="button" onClick={() => setPage(2)}>
                set-page-2
            </button>
            <button type="button" onClick={() => setPageSize(25)}>
                set-page-size-25
            </button>
        </div>
    );
}

describe('useTradingAccountPageState', () => {
    beforeEach(() => {
        configureNextNavigationMock({
            pathname: '/customer/trading-account/account-id',
            search: '',
        });
    });

    it('uses all/1/10 as default state from URL', () => {
        render(<HookProbe />);

        expect(screen.getByTestId('period')).toHaveTextContent('all');
        expect(screen.getByTestId('page')).toHaveTextContent('1');
        expect(screen.getByTestId('pageSize')).toHaveTextContent('10');
    });

    it('changes period in URL and resets trades page', async () => {
        const user = userEvent.setup();

        configureNextNavigationMock({
            pathname: '/customer/trading-account/account-id',
            search: 'tradesPage=3&tradesPageSize=25',
        });

        render(<HookProbe />);

        await user.click(screen.getByRole('button', { name: 'set-7d' }));

        expect(getNextNavigationMockState().replace).toHaveBeenCalledWith(
            expect.stringContaining('/customer/trading-account/account-id?'),
            { scroll: false },
        );
        expect(getNextNavigationSearchParams().get('period')).toBe('7d');
        expect(getNextNavigationSearchParams().get('tradesPage')).toBeNull();
        expect(getNextNavigationSearchParams().get('tradesPageSize')).toBe('25');
    });

    it('removes period param when switching back to all', async () => {
        const user = userEvent.setup();

        configureNextNavigationMock({
            pathname: '/customer/trading-account/account-id',
            search: 'period=30d&tradesPage=2',
        });

        render(<HookProbe />);

        await user.click(screen.getByRole('button', { name: 'set-all' }));

        expect(getNextNavigationMockState().replace).toHaveBeenCalledWith(
            '/customer/trading-account/account-id',
            { scroll: false },
        );
    });

    it('changes page without mutating period', async () => {
        const user = userEvent.setup();

        configureNextNavigationMock({
            pathname: '/customer/trading-account/account-id',
            search: 'period=90d',
        });

        render(<HookProbe />);

        await user.click(screen.getByRole('button', { name: 'set-page-2' }));

        expect(getNextNavigationMockState().replace).toHaveBeenCalledWith(
            expect.stringContaining('/customer/trading-account/account-id?'),
            { scroll: false },
        );
        expect(getNextNavigationSearchParams().get('period')).toBe('90d');
        expect(getNextNavigationSearchParams().get('tradesPage')).toBe('2');
    });

    it('changes page size and resets trades page', async () => {
        const user = userEvent.setup();

        configureNextNavigationMock({
            pathname: '/customer/trading-account/account-id',
            search: 'period=7d&tradesPage=4',
        });

        render(<HookProbe />);

        await user.click(screen.getByRole('button', { name: 'set-page-size-25' }));

        expect(getNextNavigationMockState().replace).toHaveBeenCalledWith(
            expect.stringContaining('/customer/trading-account/account-id?'),
            { scroll: false },
        );
        expect(getNextNavigationSearchParams().get('period')).toBe('7d');
        expect(getNextNavigationSearchParams().get('tradesPage')).toBeNull();
        expect(getNextNavigationSearchParams().get('tradesPageSize')).toBe('25');
    });

    it('does not navigate when setting the already active default period', async () => {
        const user = userEvent.setup();

        render(<HookProbe />);

        await user.click(screen.getByRole('button', { name: 'set-all' }));

        expect(getNextNavigationMockState().replace).not.toHaveBeenCalled();
    });
});
