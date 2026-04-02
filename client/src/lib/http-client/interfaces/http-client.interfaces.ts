export interface HttpClientOptions {
    baseUrl: string;
    headers?: HeadersInit;
    cache?: RequestCache;
    next?: {
        revalidate?: number;
        tags?: string[];
    };
}

export interface RequestConfig {
    params?: Record<string, string | number | boolean>;
    timeout?: number;
    signal?: AbortSignal;
}

export interface HttpResponse<T> {
    data?: T;
    success: boolean;
    statusCode: number;
    message?: string;
    error?: string | string[] | null;
    //headers: Headers;
    timestamp: string;
}

export interface HttpError {
    success: false;
    statusCode?: number;
    message?: string;
    error: string | string[] | null;
    timestamp: string;
    path: string;
}
