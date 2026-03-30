import { ChangeEvent } from 'react';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { Loader } from '@/components/loader/Loader';
import { Button } from '@/components/button';
import {
    formatCurrency,
    formatDateTime,
    formatInteger,
    formatNumber,
} from '@/features/module-trading-account/lib/format';
import { useTradingAccountTrades } from '@/features/module-trading-account/hooks/query';
import { useTradePagination } from '@/features/module-trading-account/hooks/use-trade-pagination';
import styles from '@/features/module-trading-account/components/trading-list/styles.module.css';

type TradingListProps = {
    tradingAccountId: string;
};

export const TradingList = ({ tradingAccountId }: TradingListProps) => {
    const { page, pageSize, pageSizeOptions, setPage, setPageSize } = useTradePagination();
    const { data, isLoading, isFetching, isPlaceholderData, isError, error } =
        useTradingAccountTrades(tradingAccountId, page, pageSize);

    const displayPage = isPlaceholderData ? (data?.page ?? page) : page;
    const displayPageSize = isPlaceholderData ? (data?.pageSize ?? pageSize) : pageSize;

    const totalItems = data?.totalItems ?? 0;
    const totalPages = data?.totalPages ?? 1;
    const trades = data?.items ?? [];
    const pageStart = totalItems ? (displayPage - 1) * displayPageSize + 1 : 0;
    const pageEnd = Math.min(displayPage * displayPageSize, totalItems);

    const handlePageSizeChange = (event: ChangeEvent<HTMLSelectElement>) => {
        setPageSize(Number(event.target.value));
    };

    const handlePreviousPage = () => {
        setPage(Math.max(1, page - 1));
    };

    const handleNextPage = () => {
        setPage(Math.min(totalPages, page + 1));
    };

    if (isLoading && !data) {
        return (
            <section className={styles.section}>
                <div className={styles.header}>
                    <div>
                        <p className={styles.eyebrow}>Recent activity</p>
                        <h3 className={styles.title}>Closed trades</h3>
                    </div>
                </div>
                <div className={styles.placeholder}>
                    <Loader label="Loading trades" />
                </div>
            </section>
        );
    }

    if (isError) {
        return (
            <section className={styles.section}>
                <div className={styles.header}>
                    <div>
                        <p className={styles.eyebrow}>Recent activity</p>
                        <h3 className={styles.title}>Closed trades</h3>
                    </div>
                </div>
                <EmptyState
                    title="Unable to load trades"
                    description={error instanceof Error ? error.message : 'Unknown error'}
                />
            </section>
        );
    }

    if (!trades.length) {
        return (
            <section className={styles.section}>
                <div className={styles.header}>
                    <div>
                        <p className={styles.eyebrow}>Recent activity</p>
                        <h3 className={styles.title}>Closed trades</h3>
                    </div>
                </div>
                <EmptyState
                    title="No trades to display"
                    description="Recent closed positions will appear here after synchronization."
                />
            </section>
        );
    }

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <div>
                    <p className={styles.eyebrow}>Recent activity</p>
                    <h3 className={styles.title}>Closed trades</h3>
                </div>
                <div className={styles.toolbar}>
                    <p className={styles.caption}>
                        Showing {formatInteger(pageStart)}-{formatInteger(pageEnd)} of{' '}
                        {formatInteger(totalItems)}
                    </p>
                    <label className={styles.pageSizeControl}>
                        <span>Rows per page</span>
                        <select value={displayPageSize} onChange={handlePageSizeChange} disabled={isFetching}>
                            {pageSizeOptions.map(option => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </div>

            <div className={styles.tableWrap} aria-busy={isFetching}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Symbol</th>
                            <th>Side</th>
                            <th>Closed PnL</th>
                            <th>Qty</th>
                            <th>Entry</th>
                            <th>Exit</th>
                            <th>Leverage</th>
                            <th>Opened</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trades.map(trade => (
                            <tr key={trade.id}>
                                <td>{trade.symbol}</td>
                                <td>
                                    <span
                                        className={
                                            trade.side === 'Buy' ? styles.sideBuy : styles.sideSell
                                        }
                                    >
                                        {trade.side}
                                    </span>
                                </td>
                                <td
                                    className={
                                        trade.closedPnl >= 0 ? styles.positive : styles.negative
                                    }
                                >
                                    {formatCurrency(trade.closedPnl)}
                                </td>
                                <td>{formatNumber(trade.qty)}</td>
                                <td>{formatNumber(trade.avgEntryPrice)}</td>
                                <td>{formatNumber(trade.avgExitPrice)}</td>
                                <td>{trade.leverage}x</td>
                                <td>{formatDateTime(trade.createdTime)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className={styles.pagination}>
                <p className={styles.pageMeta}>
                    Page {formatInteger(displayPage)} of {formatInteger(totalPages)}
                </p>
                <div className={styles.pageActions}>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={page <= 1 || isFetching}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={page >= totalPages || isFetching}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </section>
    );
};
