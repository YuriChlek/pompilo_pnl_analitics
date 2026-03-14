type RequestParams = { params: Promise<{ slug: string[] }> };

const API_BASE_URL = process.env.API_BASE_URL;

async function proxyRequest(request: Request, paramsPromise: RequestParams['params']) {
    if (!API_BASE_URL) {
        return new Response('API_BASE_URL environment variable is not configured', { status: 500 });
    }

    const { slug } = await paramsPromise;
    const pathname = slug.join('/');
    const proxyURL = new URL(pathname, API_BASE_URL);
    const proxyRequest = new Request(proxyURL, request);

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
