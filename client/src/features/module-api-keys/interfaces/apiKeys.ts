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
    updateApiKey(id: string, apiKey: string, publicKey: string): Promise<ApiKey | null>;
    removeApiKey(id: string): Promise<boolean | null>;
}

export interface ApiKeySettingsPopupProps {
    apiKeyId: string;
    open: boolean;
}
