import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_NAMES } from '@/features/module-auth/enums/auth.enums';

const STATIC_PATH_REGEX =
    /^\/(_next|api|favicon\.ico$|.*\.(js|css|map|png|jpg|jpeg|gif|svg|woff|woff2)$)/;
const ADMIN_PATH_REGEX = /^\/admin(?:\/|$)/;
const CUSTOMER_PATH_REGEX = /^\/customer(?:\/|$)/;
const API_BASE_URL =
    process.env.API_BASE_URL ??
    `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost'}:${process.env.NEXT_PUBLIC_API_PORT ?? '3000'}`;

type AuthScope = 'admin' | 'customer';

type AuthRouteConfig = {
    accessCookie: COOKIE_NAMES;
    refreshCookie: COOKIE_NAMES;
    loginPath: string;
    dashboardPath: string;
    refreshPath: string;
    isProtectedRoute: (pathname: string) => boolean;
    isGuestRoute: (pathname: string) => boolean;
};

type RouteContext = {
    pathname: string;
    from: string;
};

type RefreshResult = {
    authenticated: boolean;
    setCookies: string[];
};

const AUTH_CONFIG: Record<AuthScope, AuthRouteConfig> = {
    admin: {
        accessCookie: COOKIE_NAMES.ADMIN_ACCESS_TOKEN,
        refreshCookie: COOKIE_NAMES.ADMIN_REFRESH_TOKEN,
        loginPath: '/admin/login',
        dashboardPath: '/admin/dashboard',
        refreshPath: '/admin/refresh',
        isProtectedRoute: pathname => ADMIN_PATH_REGEX.test(pathname) && pathname !== '/admin/login',
        isGuestRoute: pathname =>
            pathname === '/admin' || pathname === '/admin/' || pathname === '/admin/login',
    },
    customer: {
        accessCookie: COOKIE_NAMES.CUSTOMER_ACCESS_TOKEN,
        refreshCookie: COOKIE_NAMES.CUSTOMER_REFRESH_TOKEN,
        loginPath: '/login',
        dashboardPath: '/customer/dashboard',
        refreshPath: '/customer/refresh',
        isProtectedRoute: pathname => CUSTOMER_PATH_REGEX.test(pathname),
        isGuestRoute: pathname => pathname === '/login' || pathname === '/register',
    },
};

async function handleProxy(request: NextRequest) {
    const route = getRouteContext(request);

    if (isStaticPath(route.pathname)) {
        return NextResponse.next();
    }

    const response = NextResponse.next();
    const sessionState = await resolveSessionState(request, route, response);

    for (const scope of getScopes()) {
        const authConfig = AUTH_CONFIG[scope];

        if (authConfig.isGuestRoute(route.pathname) && sessionState[scope].authenticated) {
            return redirectWithCookies(request, authConfig.dashboardPath, sessionState[scope].setCookies);
        }

        if (authConfig.isProtectedRoute(route.pathname) && !sessionState[scope].authenticated) {
            const loginUrl = new URL(authConfig.loginPath, request.url);
            loginUrl.searchParams.set('from', route.from);

            return NextResponse.redirect(loginUrl);
        }
    }

    return response;
}

function getRouteContext(request: NextRequest): RouteContext {
    const { pathname, search } = request.nextUrl;

    return {
        pathname,
        from: `${pathname}${search}`,
    };
}

function isStaticPath(pathname: string): boolean {
    return STATIC_PATH_REGEX.test(pathname);
}

async function resolveSessionState(
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

async function ensureAuthenticatedSession(
    request: NextRequest,
    pathname: string,
    scope: AuthScope,
): Promise<RefreshResult> {
    const authConfig = AUTH_CONFIG[scope];
    const hasAccessToken = hasCookie(request, authConfig.accessCookie);
    const hasRefreshToken = hasCookie(request, authConfig.refreshCookie);
    const routeNeedsAuthCheck =
        authConfig.isProtectedRoute(pathname) || authConfig.isGuestRoute(pathname);

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

function hasCookie(request: NextRequest, cookieName: COOKIE_NAMES): boolean {
    return Boolean(request.cookies.get(cookieName)?.value);
}

async function refreshAccessToken(
    request: NextRequest,
    scope: AuthScope,
): Promise<RefreshResult> {
    const authConfig = AUTH_CONFIG[scope];

    try {
        const response = await fetch(new URL(authConfig.refreshPath, API_BASE_URL), {
            method: 'POST',
            headers: {
                cookie: request.headers.get('cookie') ?? '',
                'user-agent': request.headers.get('user-agent') ?? '',
                'x-forwarded-for': request.headers.get('x-forwarded-for') ?? '',
                'x-real-ip': request.headers.get('x-real-ip') ?? '',
            },
            cache: 'no-store',
        });
        const setCookies = getSetCookieHeaders(response.headers);
        const payload = (await response.json().catch(() => null)) as
            | { success?: boolean; data?: boolean }
            | null;
        const hasAccessCookie = setCookies.some(cookie =>
            cookie.startsWith(`${authConfig.accessCookie}=`),
        );

        return {
            authenticated:
                response.ok && payload?.success === true && payload.data === true && hasAccessCookie,
            setCookies,
        };
    } catch {
        return {
            authenticated: false,
            setCookies: [],
        };
    }
}

function redirectWithCookies(request: NextRequest, path: string, setCookies: string[]) {
    const response = NextResponse.redirect(new URL(path, request.url));

    appendSetCookies(response, setCookies);

    return response;
}

function appendSetCookies(response: NextResponse, setCookies: string[]) {
    for (const cookie of setCookies) {
        response.headers.append('set-cookie', cookie);
    }
}

function getSetCookieHeaders(headers: Headers): string[] {
    const getSetCookie = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;

    if (typeof getSetCookie === 'function') {
        return getSetCookie.call(headers);
    }

    const setCookie = headers.get('set-cookie');

    return setCookie ? [setCookie] : [];
}

function getScopes(): AuthScope[] {
    return ['admin', 'customer'];
}

export function proxy(request: NextRequest) {
    return handleProxy(request);
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
