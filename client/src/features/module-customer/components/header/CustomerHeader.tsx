'use client';

import styles from '@/features/module-customer/components/header/styles.module.css';
import { Logo } from '@/components/logo/Logo';
import { ThemeButton } from '@/components/theme-button/ThemeButton';
import { AuthButton } from '@/features/module-auth/components/auth-button/AuthButton';
import { Menu } from '@/features/module-menu/components/menu/Menu';
import type { User } from '@/features/module-auth/interfaces/auth';
import { useUser } from '@/features/module-auth/hooks/query';
import { UserRoles } from '@/features/module-auth/interfaces/auth';
import { UserBadge } from '@/features/module-auth/components/user-badge/UserBadge';

type CustomerHeaderProps = {
    initialUser: User | null;
};

export const CustomerHeader = ({ initialUser }: CustomerHeaderProps) => {
    const { data } = useUser(UserRoles.CUSTOMER, initialUser);
    const isLoginUser = !!(data && data.name);

    return (
        <header className={styles.header}>
            <Logo />
            <Menu isLogin={isLoginUser} />
            <div className={styles.headerSidebar}>
                <ThemeButton />
                {data && data.name ? <UserBadge userName={data.name} /> : null}
                <AuthButton isAuthenticated={isLoginUser} />
            </div>
        </header>
    );
};
