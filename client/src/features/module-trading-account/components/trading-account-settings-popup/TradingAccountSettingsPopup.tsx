'use client';

import { useState } from 'react';
import styles from '@/features/module-trading-account/components/trading-account-settings-popup/styles.module.css';
import {
    TradingAccountPayload,
    TradingAccountSettingsPopupProps,
} from '@/features/module-trading-account/interfaces/tradingAccount';
import {
    useRemoveTradingAccount,
    useUpdateTradingAccount,
} from '@/features/module-trading-account/hooks/mutation';
import { TradingAccountFormPopup } from '@/features/module-trading-account/components/trading-account-form-popup/TradingAccountFormPopup';

export const TradingAccountSettingsPopup = ({
    account,
    open,
    onClose,
}: TradingAccountSettingsPopupProps) => {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const { mutate: removeMutate } = useRemoveTradingAccount();
    const { mutate: updateMutate, isPending } = useUpdateTradingAccount();

    const remove = () => {
        removeMutate(account.id, {
            onSuccess: () => {
                onClose();
            },
        });
    };

    const edit = () => {
        setIsEditOpen(true);
        onClose();
    };

    const initialData: TradingAccountPayload = {
        tradingAccountName: account.tradingAccountName,
        apiKeyId: account.apiKeyId ?? '',
        exchange: account.exchange,
        market: account.market,
    };

    const handleUpdate = (payload: TradingAccountPayload) => {
        updateMutate(
            { id: account.id, payload },
            {
                onSuccess: () => {
                    setIsEditOpen(false);
                },
            },
        );
    };

    return (
        <>
            {open ? (
                <div
                    className={`${styles.menu} ${styles.menuOpen}`}
                    role="menu"
                    aria-label={`Settings for trading account ${account.id}`}
                >
                    <button
                        onClick={edit}
                        className={styles.menuItem}
                        type="button"
                        role="menuitem"
                    >
                        Edit
                    </button>
                    <button
                        onClick={remove}
                        className={`${styles.menuItem} ${styles.menuItemDanger}`}
                        type="button"
                        role="menuitem"
                    >
                        Delete
                    </button>
                </div>
            ) : null}

            <TradingAccountFormPopup
                open={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                title="Edit Trading Account"
                submitLabel="Update"
                initialData={initialData}
                currentTradingAccountId={account.id}
                onSubmit={handleUpdate}
                isPending={isPending}
            />
        </>
    );
};
