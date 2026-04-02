import { apiBaseUrl } from '@/lib/config/api-base-url.config';

const baseUrl = apiBaseUrl;
const cache: RequestCache = process.env.NODE_ENV === 'development' ? 'no-cache' : 'force-cache';

export const httpClientConfig = {
    baseUrl,
    cache,
    next: {
        revalidate: 60,
    },
};
