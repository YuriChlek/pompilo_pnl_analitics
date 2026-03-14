'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import { Button } from '@/components/button';
import { Popup } from '@/components/popup/Popup';
import styles from './styles.module.css';
import { useApiKeysList } from '@/features/module-api-keys/hooks';
import { useRouter } from 'next/navigation';
import { ApiKey } from '@/features/module-api-keys/interfaces/apiKeys';
import { useCreateTradingAccount } from '@/features/module-trading-account/hooks';

export const AddTradingAccount = () => {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        tradingAccountName: '',
        apiKeyId: '',
        exchange: '',
        market: '',
    });
    const { mutate, isPending, isError } = useCreateTradingAccount();
    const { data: apiKeysList } = useApiKeysList();
    const router = useRouter();

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'apiKeyId' && apiKeysList) {
            const selectedApiKey: ApiKey | undefined = apiKeysList.find(key => key.id === value);

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
                            <div className={styles.noApiKeys}>
                                <p>You don’t have any API Keys yet. Please add one first.</p>

                                <Button
                                    variant="secondary"
                                    type="button"
                                    onClick={() => router.push('/customer/api-keys')}
                                >
                                    Go to API Keys
                                </Button>
                            </div>
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
                                    {apiKeysList.map(apiKey => (
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
                        {!!(apiKeysList && apiKeysList.length > 0) && (
                            <Button type="submit">
                                Save
                            </Button>
                        )}
                    </div>
                </form>
            </Popup>
        </div>
    );
};
