'use client';

import { capitalCase } from 'change-case';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { Loader } from '@/components/loader/Loader';
import { StatisticDiagram } from '@/features/module-trading-account/components/statistic-diagram/StatisticDiagram';
import { TradingList } from '@/features/module-trading-account/components/trading-list/TradingList';
import { AccountStatistic } from '@/features/module-trading-account/components/account-diagram/AccountStatistic';
import { useTradingAccountDetails } from '@/features/module-trading-account/hooks/query';
import { TRADING_ACCOUNT_ANALYTICS_PERIOD_OPTIONS } from '@/features/module-trading-account/constants/analytics-periods';
import { useTradingAccountPageState } from '@/features/module-trading-account/hooks/use-trading-account-page-state';
import { formatDateTime } from '@/features/module-trading-account/lib/format';
import styles from '@/features/module-trading-account/components/trading-account-details/styles.module.css';

type TradingAccountDetailsProps = {
    id: string;
};

export const TradingAccountDetails = ({ id }: TradingAccountDetailsProps) => {
    const { period, setPeriod } = useTradingAccountPageState();
    const { data, isLoading, isError, error } = useTradingAccountDetails(id, period);

    if (isLoading) {
        return (
            <div className={styles.placeholder}>
                <Loader label="Loading trading account details" />
            </div>
        );
    }

    if (isError) {
        return (
            <EmptyState
                title="Unable to load trading account"
                description={error instanceof Error ? error.message : 'Unknown error'}
            />
        );
    }

    if (!data) {
        return (
            <EmptyState
                title="Trading account not found"
                description="The account may have been removed or is no longer available."
            />
        );
    }

    const { account, statistics, chart } = data;

    return (
        <div className={styles.layout}>
            <section className={styles.hero}>
                <div>
                    <p className={styles.eyebrow}>Trading account overview</p>
                    <h1 className={styles.accountName}>
                        {capitalCase(account.tradingAccountName || 'Untitled account')}
                    </h1>
                    <p className={styles.accountMeta}>
                        {capitalCase(account.exchange)} · {capitalCase(account.market)} market
                    </p>
                </div>

                <dl className={styles.summaryGrid}>
                    <div className={styles.summaryItem}>
                        <dt>Api Key</dt>
                        <dd>{account.apiKey?.apiKeyName ?? 'Not connected'}</dd>
                    </div>
                    <div className={styles.summaryItem}>
                        <dt>Total trades</dt>
                        <dd>{statistics.totalTrades}</dd>
                    </div>
                    <div className={styles.summaryItem}>
                        <dt>Latest trade</dt>
                        <dd>{formatDateTime(statistics.latestTradeAt)}</dd>
                    </div>
                </dl>
            </section>

            <section className={styles.analyticsToolbar}>
                <div>
                    <p className={styles.eyebrow}>Analytics range</p>
                    <h2 className={styles.toolbarTitle}>Selected period</h2>
                </div>
                <div className={styles.periodButtons} aria-label="Analytics period">
                    {TRADING_ACCOUNT_ANALYTICS_PERIOD_OPTIONS.map(option => (
                        <button
                            key={option.value}
                            type="button"
                            aria-pressed={period === option.value}
                            className={
                                period === option.value
                                    ? styles.periodButtonActive
                                    : styles.periodButton
                            }
                            onClick={() => setPeriod(option.value)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </section>

            <StatisticDiagram chart={chart} />
            <AccountStatistic statistics={statistics} />
            <TradingList tradingAccountId={id} period={period} />
        </div>
    );
};
