'use client';

import styles from './styles.module.css';
import { useApiKeysList } from '@/features/module-api-keys/hooks';
import { capitalCase } from 'change-case';
import { Loader } from '@/components/loader/Loader';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/button';

export const ApiKeysList = () => {
    const { data, isLoading, isError, error } = useApiKeysList();

    if (isLoading) {
        return (
            <div className={styles.placeholder}>
                <Loader label="Loading API keys" />
            </div>
        );
    }

    if (isError) {
        return (
            <EmptyState
                title="Unable to load API keys"
                description={error instanceof Error ? error.message : 'Unknown error'}
            />
        );
    }

    if (!data || data.length === 0) {
        return (
            <EmptyState
                title="No API keys yet"
                description="Add your first API key to start connecting exchanges."
            />
        );
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
                    <tr key={item.id}>
                        <td>{capitalCase(item.exchange ?? '')}</td>
                        <td>{capitalCase(item.connectionStatus ?? '')}</td>
                        <td>{capitalCase(item.market ?? '')}</td>
                        <td>{item.apiKeyName}</td>
                        <td>{item.apiKey}</td>
                        <td className={styles.actions}>
                            <Button variant="ghost" size="sm">
                                Settings
                            </Button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
