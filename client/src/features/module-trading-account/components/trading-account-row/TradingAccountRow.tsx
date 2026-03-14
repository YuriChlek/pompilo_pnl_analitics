import type { MouseEvent } from 'react';
import { capitalCase } from 'change-case';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/button';
import styles from '@/features/module-trading-account/components/trading-account-row/styles.module.css';
import { TradingAccount } from '@/features/module-trading-account/interfaces/tradingAccount';

type TradingAccountRowProps = {
    account: TradingAccount;
};

export const TradingAccountRow = ({ account }: TradingAccountRowProps) => {
    const router = useRouter();

    const handleClick = () => {
        router.push(`/customer/trading-account/${account.id}`);
    };

    const handleSettingsClick = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
    };

    return (
        <tr className={styles.row} onClick={handleClick} style={{ cursor: 'pointer' }}>
            <td>{capitalCase(account.tradingAccountName ?? '')}</td>
            <td>{capitalCase(account.exchange ?? '')}</td>
            <td>{capitalCase(account.market ?? '')}</td>
            <td>{account.apiKey?.apiKeyName ?? '—'}</td>

            <td className={styles.actions}>
                <Button variant="ghost" size="md" onClick={handleSettingsClick}>
                    Settings
                </Button>
            </td>
        </tr>
    );
};
