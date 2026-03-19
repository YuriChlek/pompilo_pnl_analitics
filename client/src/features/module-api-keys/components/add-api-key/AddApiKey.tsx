'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import { Button } from '@/components/button';
import { Popup } from '@/components/popup/Popup';
import styles from './styles.module.css';
import { Exchanges, MarketTypes } from '@/features/module-api-keys/enums';
import { ApiKeyPayload } from '@/features/module-api-keys/interfaces/apiKeys';
import { useCreateApiKey } from '@/features/module-api-keys/hooks/mutation';

export const AddApiKey = () => {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState<ApiKeyPayload>({
        exchange: '',
        market: '',
        apiKey: '',
        secretKey: '',
        apiKeyName: '',
    });

    const { mutate, isPending, isError } = useCreateApiKey();

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        mutate(formData, {
            onSuccess: () => {
                setOpen(false);

                setFormData({
                    exchange: '',
                    market: '',
                    apiKey: '',
                    secretKey: '',
                    apiKeyName: '',
                });
            },
        });
    };

    return (
        <div className={styles.wrapper}>
            <Button variant="secondary" onClick={() => setOpen(true)}>
                Add API Key
            </Button>

            <Popup open={open} onClose={() => setOpen(false)} title="Add API Key">
                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.field}>
                        <label htmlFor="exchange">Exchange</label>
                        <select
                            id="exchange"
                            name="exchange"
                            value={formData.exchange}
                            onChange={handleChange}
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
                        <label htmlFor="exchange">Exchange Market</label>
                        <select
                            id="market"
                            name="market"
                            value={formData.market}
                            onChange={handleChange}
                            required
                        >
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
                        <input
                            id="apiKey"
                            name="apiKey"
                            value={formData.apiKey}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="secretKey">Secret Key</label>
                        <input
                            id="secretKey"
                            type="password"
                            name="secretKey"
                            value={formData.secretKey}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="accountName">Account Name</label>
                        <input
                            id="apiKeyName"
                            name="apiKeyName"
                            value={formData.apiKeyName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className={styles.actions}>
                        <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>

                        <Button type="submit">Save</Button>
                    </div>
                </form>
            </Popup>
        </div>
    );
};
