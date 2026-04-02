import type { UserRoles } from '@/features/module-auth/enums/auth.enums';

export interface AuthButtonProps {
    isAuthenticated: boolean;
    loginPath?: string;
    className?: string;
}

export interface LoginFormProps {
    mode: UserRoles;
    title: string;
}

export interface UserBadgeProps {
    userName: string;
}
