import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTradingAccountPageState } from '@/features/module-trading-account/hooks/use-trading-account-page-state';
import {
    configureNextNavigationMock,
    getNextNavigationMockState,
    getNextNavigationSearchParams,
} from '@/tests/test-utils/mock-next-navigation';

function HookProbe() {
    const { period, setPeriod } = useTradingAccountPageState();

    return (
        <div>
            <output data-testid="period">{period}</output>
            <button type="button" onClick={() => setPeriod('7d')}>
                set-7d
            </button>
            <button type="button" onClick={() => setPeriod('all')}>
                set-all
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

    it('uses all as default state from URL', () => {
        render(<HookProbe />);

        expect(screen.getByTestId('period')).toHaveTextContent('all');
    });

    it('changes period in URL without mutating unrelated params', async () => {
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
        expect(getNextNavigationSearchParams().get('tradesPage')).toBe('3');
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
            expect.stringContaining('/customer/trading-account/account-id'),
            { scroll: false },
        );
    });

    it('does not navigate when setting the already active default period', async () => {
        const user = userEvent.setup();

        render(<HookProbe />);

        await user.click(screen.getByRole('button', { name: 'set-all' }));

        expect(getNextNavigationMockState().replace).not.toHaveBeenCalled();
    });
});
