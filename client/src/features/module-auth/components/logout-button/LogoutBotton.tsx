'use client';

import Link from 'next/link';
import { useLogout } from '@/features/module-auth/hooks';

export const LogoutBotton = () => {
    const { mutate, isPending, isError } = useLogout();
    const logout = () => {
        mutate();
    };

    return (
        <Link href={'#'} onClick={logout}>
            {'Logout'}
        </Link>
    );
};
