'use client';

import styles from '@/features/module-api-keys/components/api-keys-list/styles.module.css';
import { TradingAccountRow } from '@/features/module-trading-account/components/trading-account-row/trading-account-row';
import { Loader } from '@/components/loader/loader';
import { EmptyState } from '@/components/empty-state/empty-state';
import { useTradingAccountList } from '@/features/module-trading-account/hooks/query';

export const TradingAccountsList = () => {
    const { data, isLoading, isError, error } = useTradingAccountList();

    if (isLoading) {
        return (
            <div className={styles.placeholder}>
                <Loader label="Loading trading accounts" />
            </div>
        );
    }

    if (isError) {
        return (
            <EmptyState
                title="Unable to load trading accounts"
                description={error instanceof Error ? error.message : 'Unknown error'}
            />
        );
    }

    if (!data || data.length === 0) {
        return (
            <EmptyState
                title="No trading accounts yet"
                description="Create your first trading account to start tracking performance."
            />
        );
    }

    return (
        <table className={styles.list}>
            <thead className={styles.listHeader}>
                <tr>
                    <th>Account Name</th>
                    <th>Exchange</th>
                    <th>Market</th>
                    <th>Api Key</th>
                    <th className={styles.actions}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {data.map(item => (
                    <TradingAccountRow key={item.id} account={item} />
                ))}
            </tbody>
        </table>
    );
};
