import { USER_ROLES } from '@/module-auth/enums/auth-enums';
import { User } from '@/module-user/entities/user.entity';

const userSequence = 1;

export const buildUserEntity = (overrides: Partial<User> = {}): User => ({
    id: overrides.id ?? `user-${userSequence}`,
    name: overrides.name ?? `User ${userSequence}`,
    email: overrides.email ?? `fixture${userSequence}@example.com`,
    password: overrides.password ?? 'hashed',
    role: overrides.role ?? USER_ROLES.CUSTOMER,
    isActive: overrides.isActive ?? true,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
    tokens: overrides.tokens ?? [],
    apiKeys: overrides.apiKeys ?? [],
});
