'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import { Button } from '@/components/button';
import { Popup } from '@/components/popup/Popup';
import styles from '@/features/module-trading-account/components/add-trading-account/styles.module.css';
import { useRouter } from 'next/navigation';
import { ApiKey } from '@/features/module-api-keys/interfaces/api-keys.interfaces';
import { useCreateTradingAccount } from '@/features/module-trading-account/hooks/mutation';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { useApiKeysList } from '@/features/module-api-keys/hooks/query';
import { useAvailableTradingAccountApiKeys } from '@/features/module-trading-account/hooks/query';

export const AddTradingAccount = () => {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        tradingAccountName: '',
        apiKeyId: '',
        exchange: '',
        market: '',
    });
    const { mutate, isPending } = useCreateTradingAccount();
    const { data: apiKeysList } = useApiKeysList();
    const availableApiKeys = useAvailableTradingAccountApiKeys();
    const router = useRouter();

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'apiKeyId') {
            const selectedApiKey: ApiKey | undefined = availableApiKeys.find(
                key => key.id === value,
            );

            setFormData(prev => ({
                ...prev,
                apiKeyId: value,
                exchange: selectedApiKey?.exchange ?? '',
                market: selectedApiKey?.market ?? '',
            }));

            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        mutate(formData, {
            onSuccess: () => {
                setOpen(false);

                setFormData({
                    tradingAccountName: '',
                    apiKeyId: '',
                    exchange: '',
                    market: '',
                });
            },
        });
    };

    return (
        <div className={styles.wrapper}>
            <Button variant="secondary" onClick={() => setOpen(true)}>
                Add Trading Account
            </Button>

            <Popup open={open} onClose={() => setOpen(false)} title="Add Trading Account">
                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.field}>
                        {!apiKeysList || !apiKeysList.length ? (
                            <EmptyState
                                title="Connect an API key first"
                                description="Add an API key to link your exchange account, then return to create a trading account."
                                action={
                                    <Button
                                        variant="secondary"
                                        type="button"
                                        onClick={() => router.push('/customer/api-keys')}
                                    >
                                        Go to API Keys
                                    </Button>
                                }
                            />
                        ) : availableApiKeys.length === 0 ? (
                            <EmptyState
                                title="No available API keys"
                                description="Every API key is already linked to a trading account. Add a new API key to create another account."
                                action={
                                    <Button
                                        variant="secondary"
                                        type="button"
                                        onClick={() => router.push('/customer/api-keys')}
                                    >
                                        Go to API Keys
                                    </Button>
                                }
                            />
                        ) : (
                            <>
                                <label htmlFor="apiKey">Api Key</label>
                                <select
                                    id="apiKeyId"
                                    name="apiKeyId"
                                    value={formData.apiKeyId}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="" hidden={true}>
                                        Select Api Key
                                    </option>
                                    {availableApiKeys.map(apiKey => (
                                        <option key={apiKey.id} value={apiKey.id}>
                                            {apiKey.apiKeyName}
                                        </option>
                                    ))}
                                </select>
                            </>
                        )}
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="tradingAccountName">Trading Account Name</label>
                        <input
                            id="tradingAccountName"
                            name="tradingAccountName"
                            value={formData.tradingAccountName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className={styles.actions}>
                        <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        {!!availableApiKeys.length && (
                            <Button type="submit" disabled={isPending}>
                                Save
                            </Button>
                        )}
                    </div>
                </form>
            </Popup>
        </div>
    );
};
