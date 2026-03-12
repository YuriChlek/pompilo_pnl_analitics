export const COOKIE_NAMES = {
    CUSTOMER_ACCESS_TOKEN: 'customerAccessToken',
    ADMIN_ACCESS_TOKEN: 'adminAccessToken',
    CUSTOMER_REFRESH_TOKEN: 'customerRefreshToken',
    ADMIN_REFRESH_TOKEN: 'adminRefreshToken',
} as const;

export const JWT_ALGORITHM = 'HS256' as const;
