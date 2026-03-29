import { COOKIE_NAMES } from '@/features/module-auth/enums/auth.enums';
import { AuthScope, AuthScopeConfig } from '@/features/module-auth/lib/auth-scope';

export const AUTH_SCOPE_CONFIG: Record<AuthScope, AuthScopeConfig> = {
    admin: {
        accessCookie: COOKIE_NAMES.ADMIN_ACCESS_TOKEN,
        refreshCookie: COOKIE_NAMES.ADMIN_REFRESH_TOKEN,
        loginPath: '/admin/login',
        dashboardPath: '/admin/dashboard',
        refreshPath: '/admin/refresh',
    },
    customer: {
        accessCookie: COOKIE_NAMES.CUSTOMER_ACCESS_TOKEN,
        refreshCookie: COOKIE_NAMES.CUSTOMER_REFRESH_TOKEN,
        loginPath: '/login',
        dashboardPath: '/customer/dashboard',
        refreshPath: '/customer/refresh',
    },
};
