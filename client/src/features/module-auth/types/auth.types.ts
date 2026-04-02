import type { UserRoles } from '@/features/module-auth/enums/auth.enums';

interface BaseAuthData {
    password: string;
}

export type LoginData = BaseAuthData & {
    login: string;
    role: UserRoles;
};

export type CreateUserData = BaseAuthData & {
    name: string;
    email: string;
};
