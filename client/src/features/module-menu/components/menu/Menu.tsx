'use client';

import Link from 'next/link';
import { MenuItem, MenuTypes } from '@/features/module-menu/interfaces/menu';
import { getMenu } from '@/features/module-menu/config/menu-config';
import styles from './styles.module.css';
import { usePathname } from 'next/navigation';

export const Menu = ({isLogin} : {isLogin: boolean}) => {
    const menuType = isLogin ? MenuTypes.CUSTOMER : MenuTypes.GUEST;
    const menuItems: Array<MenuItem> = getMenu(menuType);
    const pathname = usePathname();

    return (
        <nav className={styles.nav}>
            <ul className={styles.menu}>
                {menuItems.map(({ title, href }) => {
                    const isActive = pathname === href;

                    return (
                        <li key={href}>
                            <Link
                                className={`${styles.link} ${isActive ? styles.active : ''}`}
                                href={href}
                            >
                                {title}
                            </Link>
                        </li>
                    );
                })}
                {/*<li key={LoginLogoutTitle}>
                    <LogoutBotton />
                </li>*/}
            </ul>
        </nav>
    );
};
