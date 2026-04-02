import type { NextRequest } from 'next/server';
import { AUTH_SCOPE_CONFIG } from '@/features/module-auth/config/auth-scope.config';
import { getRefreshPathByScope } from '@/features/module-auth/lib/auth-refresh';
import { getScopes } from '@/features/module-auth/lib/auth-scope';
import { isGuestRoute, isProtectedRoute } from '@/features/module-auth/lib/route-access';
import { apiBaseUrl } from '@/lib/config/api-base-url.config';
import {
    appendSetCookies,
    buildRefreshHeaders,
    getSetCookieHeaders,
    hasCookie,
} from '@/features/module-auth/server/session-http';
import { NextResponse } from 'next/server';
import type { AuthScope } from '@/features/module-auth/types/auth-scope.types';
import type { RouteContext } from '@/features/module-auth/types/route-access.types';
import type { RefreshResult } from '@/features/module-auth/types/session.types';

export async function resolveSessionState(
    request: NextRequest,
    route: RouteContext,
    response: NextResponse,
): Promise<Record<AuthScope, RefreshResult>> {
    const results = await Promise.all(
        getScopes().map(async scope => {
            const session = await ensureAuthenticatedSession(request, route.pathname, scope);

            if (session.setCookies.length > 0) {
                appendSetCookies(response, session.setCookies);
            }

            return [scope, session] as const;
        }),
    );

    return Object.fromEntries(results) as Record<AuthScope, RefreshResult>;
}

export async function ensureAuthenticatedSession(
    request: NextRequest,
    pathname: string,
    scope: AuthScope,
): Promise<RefreshResult> {
    const authConfig = AUTH_SCOPE_CONFIG[scope];
    const hasAccessToken = hasCookie(request, authConfig.accessCookie);
    const hasRefreshToken = hasCookie(request, authConfig.refreshCookie);
    const routeNeedsAuthCheck = isProtectedRoute(scope, pathname) || isGuestRoute(scope, pathname);

    if (hasAccessToken) {
        return {
            authenticated: true,
            setCookies: [],
        };
    }

    if (!hasRefreshToken || !routeNeedsAuthCheck) {
        return {
            authenticated: false,
            setCookies: [],
        };
    }

    return refreshAccessToken(request, scope);
}

export async function refreshAccessToken(
    request: NextRequest,
    scope: AuthScope,
): Promise<RefreshResult> {
    const authConfig = AUTH_SCOPE_CONFIG[scope];

    try {
        const response = await fetch(new URL(getRefreshPathByScope(scope), apiBaseUrl), {
            method: 'POST',
            headers: buildRefreshHeaders(request),
            cache: 'no-store',
        });
        const setCookies = getSetCookieHeaders(response.headers);
        const payload = (await response.json().catch(() => null)) as {
            success?: boolean;
            data?: boolean;
        } | null;
        const hasAccessCookie = setCookies.some(cookie =>
            cookie.startsWith(`${authConfig.accessCookie}=`),
        );

        return {
            authenticated:
                response.ok &&
                payload?.success === true &&
                payload.data === true &&
                hasAccessCookie,
            setCookies,
        };
    } catch {
        return {
            authenticated: false,
            setCookies: [],
        };
    }
}
