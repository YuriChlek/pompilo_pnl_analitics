import { TradingAccountDetails } from '@/features/module-trading-account/components/trading-account-details/trading-account-details';
import styles from './page.module.css';

type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function TradingAccountPage({ params }: PageProps) {
    const { id } = await params;

    return (
        <div className={styles.fullWidth}>
            <TradingAccountDetails id={id} />
        </div>
    );
}
