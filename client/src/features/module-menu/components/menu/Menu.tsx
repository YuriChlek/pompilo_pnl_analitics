'use client';

import Link from 'next/link';
import { MenuItem, MenuTypes } from '@/features/module-menu/interfaces/menu';
import { getMenu } from '@/features/module-menu/config/menu-config';
import styles from './styles.module.css';
import { usePathname } from 'next/navigation';

export const Menu = () => {
    const menuItems: Array<MenuItem> = getMenu(MenuTypes.CUSTOMER);
    const pathname = usePathname();

    return (
        <nav className="navbar navbar-default">
            <ul className={styles.menu}>
                {menuItems.length &&
                    menuItems.map(({ title, href }) => {
                        const isActive = pathname === href;

                        return (
                            <li key={href}>
                                <Link className={isActive ? 'active' : ''} href={href}>
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
