'use client';

import { useState } from 'react';
import { Button } from '@/components/button';
import styles from '@/features/module-api-keys/components/add-api-key/styles.module.css';
import { ApiKeyPayload } from '@/features/module-api-keys/interfaces/apiKeys';
import { useCreateApiKey } from '@/features/module-api-keys/hooks/mutation';
import { ApiKeyFormPopup } from '@/features/module-api-keys/components/api-key-form-popup/ApiKeyFormPopup';

export const AddApiKey = () => {
    const [open, setOpen] = useState(false);
    const { mutate, isPending } = useCreateApiKey();

    const initialData: ApiKeyPayload = {
        exchange: '',
        market: '',
        apiKey: '',
        secretKey: '',
        apiKeyName: '',
    };

    const handleSubmit = (formData: ApiKeyPayload) => {
        mutate(formData, {
            onSuccess: () => {
                setOpen(false);
            },
        });
    };

    return (
        <div className={styles.wrapper}>
            <Button variant="secondary" onClick={() => setOpen(true)}>
                Add API Key
            </Button>

            <ApiKeyFormPopup
                open={open}
                onClose={() => setOpen(false)}
                title="Add API Key"
                submitLabel="Save"
                initialData={initialData}
                onSubmit={handleSubmit}
                isPending={isPending}
            />
        </div>
    );
};
