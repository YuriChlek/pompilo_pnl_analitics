export interface ApiKey {
    id: string;
    apiKey: string;
    exchange: string;
    apiKeyName: string;
    market: string;
    connectionStatus: string;
}

export interface ApiKeyPayload {
    exchange: string;
    market: string;
    apiKey: string;
    secretKey: string;
    apiKeyName: string;
}

export interface AuthApiKeys {
    createApiKey: (apiKeyPayload: ApiKeyPayload) => Promise<ApiKey>;
    getUserApiKeys(): Promise<ApiKey[]>;
    updateApiKey(id: string, apiKeyPayload: ApiKeyPayload): Promise<ApiKey | null>;
    removeApiKey(id: string): Promise<boolean | null>;
}

export interface ApiKeySettingsPopupProps {
    apiKey: ApiKey;
    open: boolean;
    onClose: () => void;
}

export interface ApiKeyFormPopupProps {
    open: boolean;
    title: string;
    submitLabel: string;
    initialData: ApiKeyPayload;
    onClose: () => void;
    onSubmit: (payload: ApiKeyPayload) => void;
    isPending?: boolean;
}
