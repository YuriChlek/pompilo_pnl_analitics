import { AUTH_SCOPE_CONFIG } from '@/features/module-auth/config/auth-scope.config';
import { AuthScope } from '@/features/module-auth/lib/auth-scope';

export function getAuthScopeFromPath(path: string): AuthScope {
    return path.includes('admin') ? 'admin' : 'customer';
}

export function getRefreshPathByScope(scope: AuthScope): string {
    return AUTH_SCOPE_CONFIG[scope].refreshPath;
}

export function getRefreshPathByRequestPath(path: string): string {
    return getRefreshPathByScope(getAuthScopeFromPath(path));
}
