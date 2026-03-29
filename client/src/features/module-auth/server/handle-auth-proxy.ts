import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRouteContext, isStaticPath } from '@/features/module-auth/lib/route-access';
import { resolveSessionState } from '@/features/module-auth/server/session.service';
import { resolveProxyRedirect } from '@/features/module-auth/server/proxy-redirects';

export async function handleAuthProxy(request: NextRequest): Promise<NextResponse> {
    const route = getRouteContext(request.nextUrl.pathname, request.nextUrl.search);

    if (isStaticPath(route.pathname)) {
        return NextResponse.next();
    }

    const response = NextResponse.next();
    const sessionState = await resolveSessionState(request, route, response);
    const redirectResponse = resolveProxyRedirect(request, route, sessionState);

    return redirectResponse ?? response;
}
