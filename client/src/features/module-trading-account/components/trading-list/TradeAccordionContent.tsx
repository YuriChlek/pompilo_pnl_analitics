import { Button } from '@/components/button/Button';
import styles from '@/features/module-trading-account/components/trading-list/styles.module.css';
import type { TradeAccordionContentProps } from '@/features/module-trading-account/types/component-props.types';

export const TradeAccordionContent = ({ tradeId }: TradeAccordionContentProps) => {
    return (
        <div className={styles.tradeAccordion}>
            <section className={styles.chartSection}>
                <div className={styles.sectionHeader}>
                    <h4 className={styles.sectionTitle}>Realtime Candlestick Chart</h4>
                </div>
                <div className={styles.chartPlaceholder}>Chart placeholder</div>
            </section>

            <div className={styles.accordionAside}>
                <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Description</span>
                    <textarea
                        className={styles.textarea}
                        name={`description-${tradeId}`}
                        rows={4}
                    />
                </label>

                <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Conclusion</span>
                    <textarea className={styles.textarea} name={`conclusion-${tradeId}`} rows={4} />
                </label>

                <div className={styles.imageAction}>
                    <label className={styles.imageUploadLabel}>
                        <input
                            className={styles.imageUploadInput}
                            type="file"
                            accept="image/*"
                            name={`image-${tradeId}`}
                        />
                        <span className={styles.imageUploadButton}>Add image</span>
                    </label>
                </div>
            </div>
        </div>
    );
};
