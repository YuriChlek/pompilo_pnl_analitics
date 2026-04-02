import { PageTitle } from '@/components/page-title/page-title';
import { AddTradingAccount } from '@/features/module-trading-account/components/add-trading-account/add-trading-account';
import { TradingAccountsList } from '@/features/module-trading-account/components/trading-accounts-list/trading-accounts-list';

export default function CustomerTradingAccountsPage() {
    return (
        <>
            <PageTitle pageTitle={'Trading Accounts'} />
            <AddTradingAccount />
            <TradingAccountsList />
        </>
    );
}
