'use client';

import styles from '@/features/module-api-keys/components/api-key-settings-popup/styles.module.css';
import { ApiKeySettingsPopupProps } from '@/features/module-api-keys/interfaces/apiKeys';
import {useRemoveApiKey} from "@/features/module-api-keys/hooks/mutation";

export const ApiKeySettingsPopup = ({ apiKeyId, open }: ApiKeySettingsPopupProps) => {
    const {mutate} = useRemoveApiKey()
    const remove = () => {
        mutate(apiKeyId)
    };

    const edit = () => {};

    return (
        <div
            className={`${styles.menu} ${open ? styles.menuOpen : styles.menuClosed}`}
            role="menu"
            aria-label={`Settings for api key ${apiKeyId}`}
            aria-hidden={!open}
        >
            <button onClick={edit} className={styles.menuItem} type="button" role="menuitem">
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
    );
};
