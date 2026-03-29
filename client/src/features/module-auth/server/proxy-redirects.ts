import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_SCOPE_CONFIG } from '@/features/module-auth/config/auth-scope.config';
import { getScopes, type AuthScope } from '@/features/module-auth/lib/auth-scope';
import {
    isGuestRoute,
    isProtectedRoute,
    type RouteContext,
} from '@/features/module-auth/lib/route-access';
import type { RefreshResult } from '@/features/module-auth/server/session.service';
import { appendSetCookies } from '@/features/module-auth/server/session-http';

export function resolveProxyRedirect(
    request: NextRequest,
    route: RouteContext,
    sessionState: Record<AuthScope, RefreshResult>,
): NextResponse | null {
    for (const scope of getScopes()) {
        const authConfig = AUTH_SCOPE_CONFIG[scope];

        if (isGuestRoute(scope, route.pathname) && sessionState[scope].authenticated) {
            return redirectWithCookies(
                request,
                authConfig.dashboardPath,
                sessionState[scope].setCookies,
            );
        }

        if (isProtectedRoute(scope, route.pathname) && !sessionState[scope].authenticated) {
            const loginUrl = new URL(authConfig.loginPath, request.url);
            loginUrl.searchParams.set('from', route.from);

            return NextResponse.redirect(loginUrl);
        }
    }

    return null;
}

function redirectWithCookies(
    request: NextRequest,
    path: string,
    setCookies: string[],
): NextResponse {
    const response = NextResponse.redirect(new URL(path, request.url));

    appendSetCookies(response, setCookies);

    return response;
}
