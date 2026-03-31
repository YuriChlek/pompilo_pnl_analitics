'use client';

import { useEffect, useId, useRef, useState } from 'react';
import styles from '@/features/module-api-keys/components/api-keys-list/styles.module.css';
import { useApiKeysList } from '@/features/module-api-keys/hooks/query';
import { capitalCase } from 'change-case';
import { Loader } from '@/components/loader/Loader';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { Button } from '@/components/button/Button';
import { ApiKeySettingsPopup } from '@/features/module-api-keys/components/api-key-settings-popup/ApiKeySettingsPopup';

export const ApiKeysList = () => {
    const { data, isLoading, isError, error } = useApiKeysList();
    const [selectedApiKeyId, setSelectedApiKeyId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const menuId = useId();

    useEffect(() => {
        if (!selectedApiKeyId) return;

        const handlePointerDown = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setSelectedApiKeyId(null);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setSelectedApiKeyId(null);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedApiKeyId]);

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

    if (!data?.length) {
        return (
            <EmptyState
                title="No API keys yet"
                description="Add your first API key to start connecting exchanges."
            />
        );
    }

    const handleSettingsClick = (apiKeyId: string) => {
        setSelectedApiKeyId(current => (current === apiKeyId ? null : apiKeyId));
    };

    return (
        <div ref={containerRef}>
            <table className={styles.list}>
                <thead className={styles.listHeader}>
                    <tr>
                        <th>Exchange</th>
                        <th>Connection Status</th>
                        <th>Market</th>
                        <th>API Key Name</th>
                        <th>API Key</th>
                        <th className={styles.actions}>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {data.map(item => {
                        const isOpen = selectedApiKeyId === item.id;
                        const popupId = `${menuId}-${item.id}`;

                        return (
                            <tr key={item.id}>
                                <td>{capitalCase(item.exchange ?? '')}</td>
                                <td>{capitalCase(item.connectionStatus ?? '')}</td>
                                <td>{capitalCase(item.market ?? '')}</td>
                                <td>{item.apiKeyName}</td>
                                <td>{item.apiKey}</td>
                                <td className={styles.actions}>
                                    <div className={styles.actionsInner}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSettingsClick(item.id)}
                                            aria-expanded={isOpen}
                                            aria-haspopup="menu"
                                            aria-controls={isOpen ? popupId : undefined}
                                        >
                                            Settings
                                        </Button>

                                        <ApiKeySettingsPopup
                                            apiKey={item}
                                            open={isOpen}
                                            onClose={() => setSelectedApiKeyId(null)}
                                        />
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
