const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}:${process.env.NEXT_PUBLIC_API_PORT}`;
const cache: RequestCache = process.env.NODE_ENV === 'development' ? 'no-cache' : 'force-cache';

export const httpClientConfig = {
    baseUrl,
    cache,
    headers: {}, // додати заголовки за замовчуванням
    next: {
        revalidate: 60,
    },
};
