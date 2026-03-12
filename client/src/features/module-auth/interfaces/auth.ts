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

export enum UserRoles {
    CUSTOMER = 'customer',
    ADMIN = 'admin',
    SUPER_ADMIN = 'superAdmin',
}
