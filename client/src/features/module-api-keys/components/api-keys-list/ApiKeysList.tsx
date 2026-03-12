'use client';

import styles from './styles.module.css';
import { useApiKeysList } from '@/features/module-api-keys/hooks';
import { capitalCase } from 'change-case';

export const ApiKeysList = () => {
    const { data, isLoading, isError, error } = useApiKeysList();

    if (isLoading) return <p>Loading...</p>;

    if (isError) {
        return <p>Error: {error instanceof Error ? error.message : 'Unknown error'}</p>;
    }

    if (!data || data.length === 0) {
        return <p>No API keys found</p>;
    }

    return (
        <table className={styles.list}>
            <thead className={styles.listHeader}>
                <tr>
                    <th>Exchange</th>
                    <th>Connection Status</th>
                    <th>Market</th>
                    <th>Api Key Name</th>
                    <th>Api Key</th>
                    <th className={styles.actions}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {data.map(item => (
                    <tr className={styles.row} key={item.id}>
                        <td>{capitalCase(item.exchange ?? '')}</td>
                        <td>{capitalCase(item.connectionStatus ?? '')}</td>
                        <td>{capitalCase(item.market ?? '')}</td>
                        <td>{item.apiKeyName}</td>
                        <td>{item.apiKey}</td>
                        <td className={styles.actions}>
                            <button className={styles.actionsButton}>Settings</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
