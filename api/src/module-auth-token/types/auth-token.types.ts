import { User } from '@/module-user/entities/user.entity';

export type RefreshTokenVerificationResult =
    | { verified: true; user: Partial<User> }
    | { verified: false; user?: never };
