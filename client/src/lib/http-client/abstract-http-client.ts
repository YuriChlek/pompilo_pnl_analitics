import {
    HttpClientOptions,
    RequestConfig,
    HttpError,
    HttpResponse,
} from '@/lib/http-client/interfaces/http-client.interfaces';
import { HttpData, HttpMethod } from '@/lib/http-client/types/http-client.types';
import { getRefreshPathByRequestPath } from '@/features/module-auth/lib/auth-refresh';

export abstract class AbstractHttpClient {
    protected readonly baseUrl: string;
    protected readonly defaultHeaders: HeadersInit;
    protected readonly cache?: RequestCache;
    protected readonly next?: HttpClientOptions['next'];

    constructor(options: {
        baseUrl: string;
        cache: RequestCache;
        headers: HeadersInit;
        next: { revalidate: number };
    }) {
        this.baseUrl = options.baseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...options.headers,
        };
        this.cache = options.cache;
        this.next = options.next;
    }

    protected abstract request<TResponse, TBody = undefined>(
        path: string,
        method: HttpMethod,
        body?: HttpData<TBody>,
        config?: RequestConfig,
    ): Promise<HttpResponse<TResponse>>;

    get<TResponse>(path: string, config?: RequestConfig): Promise<HttpResponse<TResponse>> {
        return this.request<TResponse>(path, 'GET', undefined, config);
    }

    post<TResponse, TBody>(
        path: string,
        body: HttpData<TBody>,
        config?: RequestConfig,
    ): Promise<HttpResponse<TResponse>> {
        return this.request<TResponse, TBody>(path, 'POST', body, config);
    }

    put<TResponse, TBody>(
        path: string,
        body: HttpData<TBody>,
        config?: RequestConfig,
    ): Promise<HttpResponse<TResponse>> {
        return this.request<TResponse, TBody>(path, 'PUT', body, config);
    }

    patch<TResponse, TBody>(
        path: string,
        body: HttpData<TBody>,
        config?: RequestConfig,
    ): Promise<HttpResponse<TResponse>> {
        return this.request<TResponse, TBody>(path, 'PATCH', body, config);
    }

    delete<TResponse>(path: string, config?: RequestConfig): Promise<HttpResponse<TResponse>> {
        return this.request<TResponse>(path, 'DELETE', undefined, config);
    }

    protected async fetchData<TResponse>(
        options: RequestInit,
        url: URL,
        path: string,
        retry = true,
    ): Promise<HttpResponse<TResponse>> {
        let res = await fetch(url.toString(), options);

        if ((res.status === 401 || res.status === 403) && retry) {
            const refreshed = await this.refreshToken(path);

            if (refreshed) {
                res = await fetch(url.toString(), options);
            }
        }

        const responseBody = await res.json().catch(() => null);

        if (!res.ok) {
            throw {
                success: false,
                statusCode: res.status,
                error: responseBody?.error ?? res.statusText,
                message: responseBody?.message,
                timestamp: new Date().toISOString(),
                path,
            } satisfies HttpError;
        }

        return {
            ...responseBody,
            headers: res.headers,
        } as Promise<HttpResponse<TResponse>>;
    }

    private async refreshToken(path: string): Promise<boolean> {
        try {
            const response = await fetch(new URL(getRefreshPathByRequestPath(path), this.baseUrl), {
                method: 'POST',
                credentials: 'include',
            });

            return response.ok;
        } catch {
            return false;
        }
    }
}
