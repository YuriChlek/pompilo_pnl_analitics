import { apiBaseUrl } from '@/lib/config/api-base-url';

type RequestParams = { params: Promise<{ slug: string[] }> };
const HOP_BY_HOP_HEADERS = new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
]);

async function proxyRequest(request: Request, paramsPromise: RequestParams['params']) {
    if (!apiBaseUrl) {
        return new Response('API_BASE_URL environment variable is not configured', { status: 500 });
    }

    const { slug } = await paramsPromise;
    const pathname = slug.join('/');
    const proxyURL = new URL(pathname, apiBaseUrl);
    const requestURL = new URL(request.url);
    const proxyHeaders = new Headers(request.headers);

    proxyURL.search = requestURL.search;

    for (const header of HOP_BY_HOP_HEADERS) {
        proxyHeaders.delete(header);
    }

    const proxyRequest = new Request(proxyURL, {
        method: request.method,
        headers: proxyHeaders,
        body: request.body,
        duplex: 'half',
    } as RequestInit);

    try {
        return await fetch(proxyRequest);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected exception';

        return new Response(message, { status: 500 });
    }
}

export async function POST(request: Request, { params }: RequestParams) {
    return proxyRequest(request, params);
}

export async function GET(request: Request, { params }: RequestParams) {
    return proxyRequest(request, params);
}

export async function DELETE(request: Request, { params }: RequestParams) {
    return proxyRequest(request, params);
}

export async function PUT(request: Request, { params }: RequestParams) {
    return proxyRequest(request, params);
}

export async function PATCH(request: Request, { params }: RequestParams) {
    return proxyRequest(request, params);
}
