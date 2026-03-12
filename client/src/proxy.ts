import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_NAMES } from '@/features/module-auth/constants/auth.constants';

const STATIC_PATH_REGEX =
    /^\/(_next|api|favicon\.ico$|.*\.(js|css|map|png|jpg|jpeg|gif|svg|woff|woff2)$)/;
const ADMIN_PATH_REGEX = /^\/admin(?:\/|$)/;
const CUSTOMER_PATH_REGEX = /^\/customer(?:\/|$)/;

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (STATIC_PATH_REGEX.test(pathname)) {
        return NextResponse.next();
    }

    const adminToken = request.cookies.get(COOKIE_NAMES.ADMIN_REFRESH_TOKEN);
    const customerToken = request.cookies.get(COOKIE_NAMES.CUSTOMER_REFRESH_TOKEN);

    const isAdminLogin = pathname === '/admin/login';
    const isAdminRoot = pathname === '/admin' || pathname === '/admin/';
    const isAdminRoute = ADMIN_PATH_REGEX.test(pathname) && !isAdminLogin;

    const isCustomerLogin = pathname === '/login';
    const isCustomerRegister = pathname === '/register';
    const isCustomerRoute = CUSTOMER_PATH_REGEX.test(pathname);

    if (adminToken) {
        if (isAdminLogin) {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
        if (isAdminRoot) {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
    }

    if (customerToken) {
        if (isCustomerLogin || isCustomerRegister) {
            return NextResponse.redirect(new URL('/customer/dashboard', request.url));
        }
    }

    if (isAdminRoute && !adminToken) {
        const loginUrl = new URL('/admin/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (isCustomerRoute && !customerToken) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
