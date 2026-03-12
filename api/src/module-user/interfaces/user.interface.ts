import { UserRoles } from '@/module-auth/enums/role.enum';

export interface UserPayload {
    id: string;
    name: string;
    email: string;
    role: UserRoles;
}

export interface UserJWTPayload extends UserPayload {
    ipAddress: string;
    userAgent: string;
}
