import { ApiKeysList } from '@/features/module-api-keys/components/api-keys-list/ApiKeysList';
import { AddApiKey } from '@/features/module-api-keys/components/add-api-key/AddApiKey';
import { PageTitle } from '@/components/page-title/PageTitle';

export default function CustomerApiKeysPage() {
    return (
        <>
            <PageTitle pageTitle={'Api keys'} />
            <AddApiKey />
            <ApiKeysList />
        </>
    );
}
