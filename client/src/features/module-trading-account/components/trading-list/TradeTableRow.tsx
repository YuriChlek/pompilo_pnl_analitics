import { Fragment } from 'react';
import { Button } from '@/components/button/Button';
import { TradeAccordionContent } from '@/features/module-trading-account/components/trading-list/TradeAccordionContent';
import {
    formatCurrency,
    formatDateTime,
    formatNumber,
} from '@/features/module-trading-account/lib/format';
import { TradingAccountRecentTrade } from '@/features/module-trading-account/interfaces/trading-account.interfaces';
import styles from '@/features/module-trading-account/components/trading-list/styles.module.css';
import type { TradeTableRowProps } from '@/features/module-trading-account/types/component-props.types';

const TRADE_DETAILS_COLSPAN = 9;

export const TradeTableRow = ({ trade, isExpanded, onToggle }: TradeTableRowProps) => {
    return (
        <Fragment>
            <tr>
                <td>{trade.symbol}</td>
                <td>
                    <span className={trade.side === 'Buy' ? styles.sideBuy : styles.sideSell}>
                        {trade.side}
                    </span>
                </td>
                <td className={trade.closedPnl >= 0 ? styles.positive : styles.negative}>
                    {formatCurrency(trade.closedPnl)}
                </td>
                <td>{formatNumber(trade.qty)}</td>
                <td>{formatNumber(trade.avgEntryPrice)}</td>
                <td>{formatNumber(trade.avgExitPrice)}</td>
                <td>{trade.leverage}x</td>
                <td>{formatDateTime(trade.createdTime)}</td>
                <td>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggle(trade.id)}
                        aria-expanded={isExpanded}
                        aria-controls={`trade-details-${trade.id}`}
                        aria-label={`View ${trade.symbol} trade details`}
                    >
                        View
                    </Button>
                </td>
            </tr>
            {isExpanded ? (
                <tr id={`trade-details-${trade.id}`} className={styles.detailsTableRow}>
                    <td colSpan={TRADE_DETAILS_COLSPAN}>
                        <div className={styles.accordionEnter}>
                            <TradeAccordionContent tradeId={trade.id} />
                        </div>
                    </td>
                </tr>
            ) : null}
        </Fragment>
    );
};
