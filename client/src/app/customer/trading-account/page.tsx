import { PageTitle } from '@/components/page-title/PageTitle';
import { AddTradingAccount } from '@/features/module-trading-account/components/add-trading-account/AddTradingAccount';
import { TradingAccountsList } from '@/features/module-trading-account/components/trading-accounts-list/TradingAccountsList';

export default function CustomerTradingAccountsPage() {
    return (
        <>
            <PageTitle pageTitle={'Trading Accounts'} />
            <AddTradingAccount />
            <TradingAccountsList />
        </>
    );
}
