import { apiBaseUrl } from '@/lib/config/api-base-url';

const baseUrl = apiBaseUrl;
const cache: RequestCache = process.env.NODE_ENV === 'development' ? 'no-cache' : 'force-cache';

export const httpClientConfig = {
    baseUrl,
    cache,
    headers: {}, // додати заголовки за замовчуванням
    next: {
        revalidate: 60,
    },
};
