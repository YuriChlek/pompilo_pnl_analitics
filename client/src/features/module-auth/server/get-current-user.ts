import { cookies } from 'next/headers';
import type { User } from '@/features/module-auth/interfaces/auth';
import { UserRoles } from '@/features/module-auth/interfaces/auth';
import { apiBaseUrl } from '@/lib/config/api-base-url';

type UserResponse = {
    success?: boolean;
    data?: User;
};

export async function getCurrentUser(role: UserRoles): Promise<User | null> {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
        .getAll()
        .map(({ name, value }) => `${name}=${value}`)
        .join('; ');

    if (!cookieHeader) {
        return null;
    }

    try {
        const response = await fetch(new URL(`/${role}/me`, apiBaseUrl), {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                cookie: cookieHeader,
            },
            body: '{}',
            cache: 'no-store',
        });

        if (!response.ok) {
            return null;
        }

        const payload = (await response.json().catch(() => null)) as UserResponse | null;

        return payload?.success ? (payload.data ?? null) : null;
    } catch {
        return null;
    }
}
