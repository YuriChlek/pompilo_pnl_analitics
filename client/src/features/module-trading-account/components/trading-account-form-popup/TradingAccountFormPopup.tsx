'use client';

import { FormEvent } from 'react';
import { Button } from '@/components/button';
import { Popup } from '@/components/popup/Popup';
import styles from '@/features/module-trading-account/components/trading-account-form-popup/styles.module.css';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { useRouter } from 'next/navigation';
import { useApiKeysList } from '@/features/module-api-keys/hooks/query';
import { useAvailableTradingAccountApiKeys } from '@/features/module-trading-account/hooks/query';
import { TradingAccountFormPopupProps } from '@/features/module-trading-account/interfaces/trading-account.interfaces';

export const TradingAccountFormPopup = ({
    open,
    title,
    submitLabel,
    initialData,
    currentTradingAccountId,
    onClose,
    onSubmit,
    isPending = false,
}: TradingAccountFormPopupProps) => {
    const { data: apiKeysList } = useApiKeysList();
    const availableApiKeys = useAvailableTradingAccountApiKeys(currentTradingAccountId);
    const router = useRouter();

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget as HTMLFormElement);
        const selectedApiKey = availableApiKeys.find(
            key => key.id === String(form.get('apiKeyId') ?? ''),
        );

        onSubmit({
            tradingAccountName: String(form.get('tradingAccountName') ?? ''),
            apiKeyId: String(form.get('apiKeyId') ?? ''),
            exchange: selectedApiKey?.exchange ?? initialData.exchange,
            market: selectedApiKey?.market ?? initialData.market,
        });
    };

    return (
        <Popup open={open} onClose={onClose} title={title}>
            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.field}>
                    {!apiKeysList || !apiKeysList.length ? (
                        <EmptyState
                            title="Connect an API key first"
                            description="Add an API key to link your exchange account, then return to update a trading account."
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
                            description="Every API key is already linked to a trading account. Add a new API key to reassign this account."
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
                            <label htmlFor="apiKeyId">Api Key</label>
                            <select
                                id="apiKeyId"
                                name="apiKeyId"
                                defaultValue={initialData.apiKeyId}
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
                        defaultValue={initialData.tradingAccountName}
                        required
                    />
                </div>

                <div className={styles.actions}>
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    {!!availableApiKeys.length && (
                        <Button type="submit" disabled={isPending}>
                            {submitLabel}
                        </Button>
                    )}
                </div>
            </form>
        </Popup>
    );
};
