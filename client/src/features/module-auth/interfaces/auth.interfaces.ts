import type { UserRoles } from '@/features/module-auth/enums/auth.enums';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRoles;
}

export interface AuthApi {
    login(login: string, password: string, role: UserRoles): Promise<User | null>;
    logout(role: UserRoles): Promise<boolean>;
    register(name: string, email: string, password: string): Promise<User | null>;
    getMe(role: UserRoles): Promise<User | null>;
}
