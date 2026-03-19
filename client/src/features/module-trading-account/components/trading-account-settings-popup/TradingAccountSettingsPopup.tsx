'use client';

import styles from '@/features/module-trading-account/components/trading-account-settings-popup/styles.module.css';
import { TradingAccountSettingsPopupProps } from '@/features/module-trading-account/interfaces/tradingAccount';

export const TradingAccountSettingsPopup = ({
    tradingAccountId,
    open,
}: TradingAccountSettingsPopupProps) => {
    const remove = () => {
        console.log('deleteTradingAccount', tradingAccountId);
    };

    const edit = () => {};

    return (
        <div
            className={`${styles.menu} ${open ? styles.menuOpen : styles.menuClosed}`}
            role="menu"
            aria-label={`Settings for trading account ${tradingAccountId}`}
            aria-hidden={!open}
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
    );
};
