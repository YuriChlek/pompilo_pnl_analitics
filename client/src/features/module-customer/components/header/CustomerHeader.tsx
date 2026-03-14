'use client';

import styles from './styles.module.css';
import { Logo } from '@/components/logo/Logo';
import { ThemeButton } from '@/components/theme-button/ThemeButton';
import { AuthButton } from '@/features/module-auth/components/auth-button';
import { Menu } from '@/features/module-menu/components/menu/Menu';
import { useUser } from '@/features/module-auth/hooks';
import { UserRoles } from '@/features/module-auth/interfaces/auth';
import { UserBadge } from '@/features/module-auth/components/user-badge/UserBadge';

export const CustomerHeader = () => {
    const { data } = useUser(UserRoles.CUSTOMER);
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
