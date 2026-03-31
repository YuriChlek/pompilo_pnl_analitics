import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { capitalCase } from 'change-case';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/button/Button';
import styles from '@/features/module-trading-account/components/trading-account-row/styles.module.css';
import { TradingAccount } from '@/features/module-trading-account/interfaces/tradingAccount';
import { TradingAccountSettingsPopup } from '@/features/module-trading-account/components/trading-account-settings-popup/TradingAccountSettingsPopup';

type TradingAccountRowProps = {
    account: TradingAccount;
};

export const TradingAccountRow = ({ account }: TradingAccountRowProps) => {
    const router = useRouter();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const actionsRef = useRef<HTMLTableCellElement | null>(null);

    useEffect(() => {
        if (!isSettingsOpen) {
            return;
        }

        const handlePointerDown = (event: globalThis.MouseEvent) => {
            if (!actionsRef.current?.contains(event.target as Node)) {
                setIsSettingsOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsSettingsOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isSettingsOpen]);

    const handleClick = () => {
        router.push(`/customer/trading-account/${account.id}`);
    };

    const handleSettingsClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        setIsSettingsOpen(current => !current);
    };

    return (
        <tr className={styles.row} onClick={handleClick} style={{ cursor: 'pointer' }}>
            <td>{capitalCase(account.tradingAccountName ?? '')}</td>
            <td>{capitalCase(account.exchange ?? '')}</td>
            <td>{capitalCase(account.market ?? '')}</td>
            <td>{account.apiKey?.apiKeyName ?? '—'}</td>

            <td className={styles.actions} ref={actionsRef}>
                <div className={styles.actionsInner} onClick={event => event.stopPropagation()}>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSettingsClick}
                        aria-expanded={isSettingsOpen}
                    >
                        Settings
                    </Button>

                    <TradingAccountSettingsPopup
                        account={account}
                        open={isSettingsOpen}
                        onClose={() => setIsSettingsOpen(false)}
                    />
                </div>
            </td>
        </tr>
    );
};
