'use client';

import { useTradingAccountList } from '@/features/module-trading-account/hooks';
import styles from '@/features/module-api-keys/components/api-keys-list/styles.module.css';
import { TradingAccountRow } from '@/features/module-trading-account/components/trading-account-row/TradingAccountRow';

export const TradingAccountsList = () => {
    const { data, isLoading, isError, error } = useTradingAccountList();

    if (isLoading) return <p>Loading...</p>;

    if (isError) {
        return <p>Error: {error instanceof Error ? error.message : 'Unknown error'}</p>;
    }

    if (!data || data.length === 0) {
        return <p>No trading accounts found</p>;
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
