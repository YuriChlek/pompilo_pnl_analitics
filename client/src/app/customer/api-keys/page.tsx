import { ApiKeysList } from '@/features/module-api-keys/components/api-keys-list/api-keys-list';
import { AddApiKey } from '@/features/module-api-keys/components/add-api-key/add-api-key';
import { PageTitle } from '@/components/page-title/page-title';

export default function CustomerApiKeysPage() {
    return (
        <>
            <PageTitle pageTitle={'Api keys'} />
            <AddApiKey />
            <ApiKeysList />
        </>
    );
}
