'use client';

import { useState } from 'react';
import styles from '@/features/module-api-keys/components/api-key-settings-popup/styles.module.css';
import {
    ApiKeyPayload,
    ApiKeySettingsPopupProps,
} from '@/features/module-api-keys/interfaces/apiKeys';
import { useRemoveApiKey, useUpdateApiKey } from '@/features/module-api-keys/hooks/mutation';
import { ApiKeyFormPopup } from '@/features/module-api-keys/components/api-key-form-popup/ApiKeyFormPopup';

export const ApiKeySettingsPopup = ({ apiKey, open, onClose }: ApiKeySettingsPopupProps) => {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const { mutate: removeMutate } = useRemoveApiKey();
    const { mutate: updateMutate, isPending } = useUpdateApiKey();

    const remove = () => {
        removeMutate(apiKey.id, {
            onSuccess: () => {
                onClose();
            },
        });
    };

    const edit = () => {
        setIsEditOpen(true);
        onClose();
    };

    const initialData: ApiKeyPayload = {
        exchange: apiKey.exchange,
        market: apiKey.market,
        apiKey: '',
        secretKey: '',
        apiKeyName: apiKey.apiKeyName,
    };

    const handleUpdate = (payload: ApiKeyPayload) => {
        updateMutate(
            { id: apiKey.id, payload },
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
                    aria-label={`Settings for api key ${apiKey.id}`}
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

            <ApiKeyFormPopup
                open={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                title="Edit API Key"
                submitLabel="Update"
                initialData={initialData}
                onSubmit={handleUpdate}
                isPending={isPending}
            />
        </>
    );
};
