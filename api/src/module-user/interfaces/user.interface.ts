import { USER_ROLES } from '@/module-auth/enums';

export interface UserPayload {
    id: string;
    name: string;
    email: string;
    role: USER_ROLES;
}

export interface UserJWTPayload extends UserPayload {
    ipAddress: string;
    userAgent: string;
}
