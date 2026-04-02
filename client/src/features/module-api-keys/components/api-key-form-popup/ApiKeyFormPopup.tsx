'use client';

import { FormEvent } from 'react';
import { Button } from '@/components/button';
import { Popup } from '@/components/popup/Popup';
import styles from '@/features/module-api-keys/components/api-key-form-popup/styles.module.css';
import { Exchanges, MarketTypes } from '@/features/module-api-keys/enums/api-keys.enums';
import type { ApiKeyFormPopupProps } from '@/features/module-api-keys/interfaces/api-keys.interfaces';

export const ApiKeyFormPopup = ({
    open,
    title,
    submitLabel,
    initialData,
    onClose,
    onSubmit,
    isPending = false,
}: ApiKeyFormPopupProps) => {
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget as HTMLFormElement);

        onSubmit({
            exchange: String(form.get('exchange') ?? ''),
            market: String(form.get('market') ?? ''),
            apiKey: String(form.get('apiKey') ?? ''),
            secretKey: String(form.get('secretKey') ?? ''),
            apiKeyName: String(form.get('apiKeyName') ?? ''),
        });
    };

    return (
        <Popup open={open} onClose={onClose} title={title}>
            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.field}>
                    <label htmlFor="exchange">Exchange</label>
                    <select
                        id="exchange"
                        name="exchange"
                        defaultValue={initialData.exchange}
                        required
                    >
                        <option value="" hidden={true}>
                            Select exchange
                        </option>
                        <option value={Exchanges.BYBIT}>Bybit</option>
                        <option value={Exchanges.BYBIT_DEMO}>Bybit Demo</option>
                        <option value={Exchanges.BINANCE}>Binance</option>
                        <option value={Exchanges.OKX}>OKX</option>
                        <option value={Exchanges.HYPER_LIQUID}>Hyper Liquid</option>
                    </select>
                </div>

                <div className={styles.field}>
                    <label htmlFor="market">Exchange Market</label>
                    <select id="market" name="market" defaultValue={initialData.market} required>
                        <option value="" hidden={true}>
                            Select market
                        </option>
                        <option value={MarketTypes.FUTURES}>Futures</option>
                        <option value={MarketTypes.SPOT}>Spot</option>
                        <option value={MarketTypes.INVERSE_FUTURES}>Inverse Futures</option>
                    </select>
                </div>

                <div className={styles.field}>
                    <label htmlFor="apiKey">Api Key</label>
                    <input id="apiKey" name="apiKey" defaultValue={initialData.apiKey} required />
                </div>

                <div className={styles.field}>
                    <label htmlFor="secretKey">Secret Key</label>
                    <input
                        id="secretKey"
                        type="password"
                        name="secretKey"
                        defaultValue={initialData.secretKey}
                        required
                    />
                </div>

                <div className={styles.field}>
                    <label htmlFor="apiKeyName">Account Name</label>
                    <input
                        id="apiKeyName"
                        name="apiKeyName"
                        defaultValue={initialData.apiKeyName}
                        required
                    />
                </div>

                <div className={styles.actions}>
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Cancel
                    </Button>

                    <Button type="submit" disabled={isPending}>
                        {submitLabel}
                    </Button>
                </div>
            </form>
        </Popup>
    );
};
