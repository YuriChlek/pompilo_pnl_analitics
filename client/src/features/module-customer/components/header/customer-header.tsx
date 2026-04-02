'use client';

import styles from '@/features/module-customer/components/header/styles.module.css';
import {Logo} from "@/components/logo/logo";
import {ThemeButton} from "@/components/theme-button/theme-button";
import { AuthButton } from '@/features/module-auth/components/auth-button/auth-button';
import { Menu } from '@/features/module-menu/components/menu/menu';
import { useUser } from '@/features/module-auth/hooks/query';
import { UserRoles } from '@/features/module-auth/enums/auth.enums';
import { UserBadge } from '@/features/module-auth/components/user-badge/user-badge';
import type { CustomerHeaderProps } from '@/features/module-customer/interfaces/customer.interfaces';
import {MenuTypes} from "@/features/module-menu/enums/menu.enums";



export const CustomerHeader = ({ initialUser }: CustomerHeaderProps) => {
    const { data } = useUser(UserRoles.CUSTOMER, initialUser);
    const isLoginUser = !!(data && data.name);
    const menuType = isLoginUser ? MenuTypes.CUSTOMER : MenuTypes.GUEST;

    return (
        <header className={styles.header}>
            <Logo />
            <Menu menuType={menuType} />
            <div className={styles.headerSidebar}>
                <ThemeButton />
                {data && data.name ? <UserBadge userName={data.name} /> : null}
                <AuthButton isAuthenticated={isLoginUser} />
            </div>
        </header>
    );
};
