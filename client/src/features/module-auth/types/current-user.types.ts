import type { User } from '@/features/module-auth/interfaces/auth.interfaces.interfaces';

export type UserResponse = {
    success?: boolean;
    data?: User;
};
