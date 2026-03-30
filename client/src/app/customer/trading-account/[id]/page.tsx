import { TradingAccountDetails } from '@/features/module-trading-account/components/trading-account-details/TradingAccountDetails';

type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function TradingAccountPage({ params }: PageProps) {
    const { id } = await params;

    return (
        <>
            <TradingAccountDetails id={id} />
        </>
    );
}
