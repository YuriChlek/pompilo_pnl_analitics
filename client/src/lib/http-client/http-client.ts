import {
    HttpData,
    HttpMethod,
    HttpResponse,
    RequestConfig,
} from '@/lib/http-client/http-client-entities';
import { httpClientConfig } from '@/lib/http-client/http-client.config';
import { AbstractHttpClient } from '@/lib/http-client/abstract-http-client';

class HttpClient extends AbstractHttpClient {
    protected async request<TResponse, TBody = undefined>(
        path: string,
        method: HttpMethod,
        body?: HttpData<TBody>,
        config?: RequestConfig,
    ): Promise<HttpResponse<TResponse>> {
        const requestBaseUrl =
            typeof window === 'undefined' ? this.baseUrl : window.location.origin;
        const url = new URL(`/api${path}`, requestBaseUrl);

        if (config?.params) {
            Object.entries(config.params).forEach(([key, value]) =>
                url.searchParams.append(key, String(value)),
            );
        }

        const options: RequestInit = {
            method,
            headers: this.defaultHeaders,
            body: body ? JSON.stringify(body) : undefined,
            credentials: 'include',
            cache: this.cache,
            next: this.next,
            signal: config?.signal,
        };

        return await this.fetchData(options, url, path);
    }
}

export const apiClient = new HttpClient(httpClientConfig);
