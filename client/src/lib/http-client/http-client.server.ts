'use server';

import { cookies, headers } from 'next/headers';
import { Dispatcher } from 'undici-types';
import {
    HttpResponse,
    RequestConfig,
} from '@/lib/http-client/interfaces/http-client.interfaces';
import { HttpData } from '@/lib/http-client/types/http-client.types';
import { httpClientConfig } from '@/lib/http-client/config/http-client.config';
import { AbstractHttpClient } from '@/lib/http-client/abstract-http-client';

class ServerHttpClient extends AbstractHttpClient {
    protected async request<TResponse, TBody = undefined>(
        path: string,
        method: Dispatcher.HttpMethod,
        body?: HttpData<TBody>,
        config?: RequestConfig,
    ): Promise<HttpResponse<TResponse>> {
        const url = new URL(path, this.baseUrl);

        if (config?.params) {
            Object.entries(config.params).forEach(([key, value]) =>
                url.searchParams.append(key, String(value)),
            );
        }

        const headersInit = new Headers({ ...this.defaultHeaders });

        headersInit.set('cookie', cookies().toString());
        headersInit.set('user-agent', (await headers()).get('user-agent') ?? '');

        const options: RequestInit = {
            method,
            headers: headersInit,
            body: body ? JSON.stringify(body) : undefined,
            credentials: 'include',
            cache: this.cache,
            next: this.next,
            signal: config?.signal,
        };

        return this.fetchData(options, url, path);
    }
}

export const getApiServerClient = async () => {
    return new ServerHttpClient(httpClientConfig);
};
