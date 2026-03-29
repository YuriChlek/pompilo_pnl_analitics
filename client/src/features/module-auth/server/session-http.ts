import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_NAMES } from '@/features/module-auth/enums/auth.enums';

export function hasCookie(request: NextRequest, cookieName: COOKIE_NAMES): boolean {
    return Boolean(request.cookies.get(cookieName)?.value);
}

export function buildRefreshHeaders(request: NextRequest): HeadersInit {
    return {
        cookie: request.headers.get('cookie') ?? '',
        'user-agent': request.headers.get('user-agent') ?? '',
        'x-forwarded-for': request.headers.get('x-forwarded-for') ?? '',
        'x-real-ip': request.headers.get('x-real-ip') ?? '',
    };
}

export function appendSetCookies(response: NextResponse, setCookies: string[]): void {
    for (const cookie of setCookies) {
        response.headers.append('set-cookie', cookie);
    }
}

export function getSetCookieHeaders(headers: Headers): string[] {
    const getSetCookie = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;

    if (typeof getSetCookie === 'function') {
        return getSetCookie.call(headers);
    }

    const setCookie = headers.get('set-cookie');

    return setCookie ? [setCookie] : [];
}
