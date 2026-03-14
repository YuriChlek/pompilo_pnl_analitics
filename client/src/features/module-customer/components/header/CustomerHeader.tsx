'use client';

import styles from './styles.module.css';
import { Logo } from '@/components/logo/Logo';
import { ThemeButton } from '@/components/theme-button/ThemeButton';
import { Menu } from '@/features/module-menu/components/menu/Menu';
import { LogoutBotton } from '@/features/module-auth/components/logout-button/LogoutBotton';
import { useUser } from '@/features/module-auth/hooks';
import { UserRoles } from '@/features/module-auth/interfaces/auth';
import { LoginButton } from '@/features/module-auth/components/login-button/LoginButton';
import { UserBadge } from '@/features/module-auth/components/user-badge/UserBadge';
import {useRouter} from "next/navigation";

export const CustomerHeader = () => {
    const { data, isLoading, isError, error } = useUser(UserRoles.CUSTOMER);
    const isLoginUser = !!(data && data.name);

    return (
        <header className={styles.header}>
            <Logo />
            <Menu isLogin={isLoginUser} />
            <div className={styles.headerSidebar}>
                <ThemeButton />
                {data && data.name ? (
                    <>
                        <UserBadge userName={data.name} />
                        <LogoutBotton />
                    </>
                ) : (
                    <LoginButton />
                )}
            </div>
        </header>
    );
};
