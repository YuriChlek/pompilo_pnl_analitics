type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function TradingAccountPage({ params }: PageProps) {
    const { id } = await params;

    return (
        <div>
            <h1>Trading Account</h1>
            <p>Account ID: {id}</p>
        </div>
    );
}
