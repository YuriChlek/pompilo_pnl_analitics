import { HttpResponse } from '@/lib/http-client';
import { apiClient } from '@/lib/http-client/http-client';
import type { AuthApi, User } from '@/features/module-auth/interfaces/auth.interfaces.interfaces';
import { UserRoles } from '@/features/module-auth/enums/auth.enums';
import type { CreateUserData, LoginData } from '@/features/module-auth/types/auth.types';

export const authService: AuthApi = {
    async login(login: string, password: string, role: UserRoles): Promise<User> {
        const requestData: LoginData = { login, password, role };
        const response: HttpResponse<User> = await apiClient.post<User, LoginData>(
            `/${role}/login`,
            requestData,
        );

        if (!response.success) {
            throw new Error(response.message);
        }

        return response.data as unknown as User;
    },
    async register(name: string, email: string, password: string): Promise<User> {
        try {
            const requestData: CreateUserData = {
                name,
                email,
                password,
            };

            const response: HttpResponse<User> = await apiClient.post<User, CreateUserData>(
                '/customer/register',
                requestData,
            );

            if (!response.success) {
                throw new Error(response.message);
            }

            return response.data as unknown as User;
        } catch (error) {
            throw error;
        }
    },
    async logout(role: UserRoles): Promise<boolean> {
        const response: HttpResponse<unknown> = await apiClient.post(`/${role}/logout`, {});

        return response.success;
    },

    async getMe(role: UserRoles): Promise<User | null> {
        try {
            const response: HttpResponse<User> = await apiClient.post(`/${role}/me`, {});
            if (!response.success) {
                throw new Error(response.message);
            }

            return response.data as unknown as User;
        } catch (error) {
            throw error;
        }
    },
};
