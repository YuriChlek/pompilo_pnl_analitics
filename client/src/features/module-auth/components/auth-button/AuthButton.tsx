'use client';

import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/button';
import { useLogout } from '@/features/module-auth/hooks/mutation';
import styles from '@/features/module-auth/components/auth-button/styles.module.css';

type AuthButtonProps = {
    isAuthenticated: boolean;
    loginPath?: string;
    className?: string;
};

export const AuthButton = ({
    isAuthenticated,
    loginPath = '/login',
    className,
}: AuthButtonProps) => {
    const router = useRouter();
    const { mutate, isPending } = useLogout();

    const handleClick = () => {
        if (isAuthenticated) {
            mutate();

            return;
        }

        router.push(loginPath);
    };

    const label = isAuthenticated ? 'Logout' : 'Login';
    const ariaLabel = isAuthenticated ? 'Logout from your account' : 'Navigate to login page';

    return (
        <Button
            className={clsx(styles.authButton, className)}
            variant="secondary"
            size="sm"
            type="button"
            onClick={handleClick}
            disabled={isPending}
            aria-label={ariaLabel}
        >
            {label}
        </Button>
    );
};
