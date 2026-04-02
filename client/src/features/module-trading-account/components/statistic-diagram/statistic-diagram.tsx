import { EmptyState } from '@/components/empty-state/empty-state';
import { formatChartLabel } from '@/features/module-trading-account/lib/format';
import { LazyLineChart } from '@/components/charts/lazy-line-chart';
import styles from '@/features/module-trading-account/components/statistic-diagram/styles.module.css';
import type { StatisticDiagramProps } from '@/features/module-trading-account/types/component-props.types';

export const StatisticDiagram = ({ chart }: StatisticDiagramProps) => {
    if (!chart.length) {
        return (
            <section className={styles.card}>
                <div className={styles.header}>
                    <div>
                        <p className={styles.eyebrow}>Performance curve</p>
                        <h3 className={styles.title}>Cumulative closed PnL</h3>
                    </div>
                </div>
                <EmptyState
                    title="No closed trades yet"
                    description="The chart will appear after the first synchronized closed positions."
                />
            </section>
        );
    }

    return (
        <section className={styles.card}>
            <div className={styles.header}>
                <div>
                    <p className={styles.eyebrow}>Performance curve</p>
                    <h3 className={styles.title}>Cumulative closed PnL</h3>
                </div>
                <p className={styles.caption}>Built from synchronized closed trades.</p>
            </div>

            <div className={styles.chart}>
                <LazyLineChart
                    data={{
                        categories: chart.map(point => formatChartLabel(point.time)),
                        series: [
                            {
                                name: 'Closed PnL',
                                data: chart.map(point => point.cumulativeClosedPnl),
                                color: '#60a5fa',
                            },
                        ],
                    }}
                    width="100%"
                    height={360}
                    smooth={true}
                    area={false}
                />
            </div>
        </section>
    );
};
