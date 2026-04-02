'use client';

import { ChangeEvent, useState } from 'react';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { Loader } from '@/components/loader/Loader';
import { Button } from '@/components/button/Button';
import { TradeTableRow } from '@/features/module-trading-account/components/trading-list/TradeTableRow';
import { formatInteger } from '@/features/module-trading-account/lib/format';
import { TradingAccountRecentTradePage } from '@/features/module-trading-account/interfaces/trading-account.interfaces';
import { useTradingAccountTrades } from '@/features/module-trading-account/hooks/query';
import styles from '@/features/module-trading-account/components/trading-list/styles.module.css';
import type { TradingListProps } from '@/features/module-trading-account/types/component-props.types';

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const EMPTY_TRADES_PAGE: TradingAccountRecentTradePage = {
    items: [],
    page: DEFAULT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
};

export const TradingList = ({ tradingAccountId, period }: TradingListProps) => {
    const [page, setPage] = useState(DEFAULT_PAGE);
    const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
    const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
    const { data, isLoading, isFetching, isPlaceholderData, isError, error } =
        useTradingAccountTrades(tradingAccountId, page, pageSize, period);
    const tradePage = data ?? EMPTY_TRADES_PAGE;

    const displayPage = isPlaceholderData ? tradePage.page : page;
    const displayPageSize = isPlaceholderData ? tradePage.pageSize : pageSize;
    const { totalItems, totalPages, items: trades } = tradePage;
    const pageStart = totalItems ? (displayPage - 1) * displayPageSize + 1 : 0;
    const pageEnd = Math.min(displayPage * displayPageSize, totalItems);

    const handlePageSizeChange = (event: ChangeEvent<HTMLSelectElement>) => {
        setPage(DEFAULT_PAGE);
        setPageSize(Number(event.target.value));
    };

    const handlePreviousPage = () => {
        setPage(Math.max(1, page - 1));
    };

    const handleNextPage = () => {
        setPage(Math.min(totalPages, page + 1));
    };

    const handleTradeToggle = (tradeId: string) => {
        setExpandedTradeId(currentTradeId => (currentTradeId === tradeId ? null : tradeId));
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
                        <select
                            value={displayPageSize}
                            onChange={handlePageSizeChange}
                            disabled={isFetching}
                        >
                            {PAGE_SIZE_OPTIONS.map(option => (
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
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trades.map(trade => (
                            <TradeTableRow
                                key={trade.id}
                                trade={trade}
                                isExpanded={expandedTradeId === trade.id}
                                onToggle={handleTradeToggle}
                            />
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
