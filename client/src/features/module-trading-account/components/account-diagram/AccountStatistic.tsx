import {
    formatCurrency,
    formatDateTime,
    formatInteger,
    formatPercent,
} from '@/features/module-trading-account/lib/format';
import styles from '@/features/module-trading-account/components/account-diagram/styles.module.css';
import type { AccountStatisticProps } from '@/features/module-trading-account/types/component-props.types';

export const AccountStatistic = ({ statistics }: AccountStatisticProps) => {
    const items = [
        { label: 'Total closed PnL', value: formatCurrency(statistics.totalClosedPnl) },
        { label: 'Winning trades', value: formatInteger(statistics.winningTrades) },
        { label: 'Losing trades', value: formatInteger(statistics.losingTrades) },
        { label: 'Win rate', value: formatPercent(statistics.winRate) },
        { label: 'Gross profit', value: formatCurrency(statistics.grossProfit) },
        { label: 'Gross loss', value: formatCurrency(statistics.grossLoss) },
        { label: 'Average trade', value: formatCurrency(statistics.averageClosedPnl) },
        { label: 'Best trade', value: formatCurrency(statistics.bestTrade) },
        { label: 'Worst trade', value: formatCurrency(statistics.worstTrade) },
        {
            label: 'Profit factor',
            value: statistics.profitFactor === null ? '—' : statistics.profitFactor.toFixed(2),
        },
        { label: 'Latest trade', value: formatDateTime(statistics.latestTradeAt) },
        { label: 'Total trades', value: formatInteger(statistics.totalTrades) },
    ];

    return (
        <section className={styles.card}>
            <div className={styles.header}>
                <p className={styles.eyebrow}>Key metrics</p>
                <h3 className={styles.title}>Account statistics</h3>
            </div>

            <div className={styles.grid}>
                {items.map(item => (
                    <article className={styles.stat} key={item.label}>
                        <p className={styles.label}>{item.label}</p>
                        <p className={styles.value}>{item.value}</p>
                    </article>
                ))}
            </div>
        </section>
    );
};
