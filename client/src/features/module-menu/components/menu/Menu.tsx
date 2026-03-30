'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { MenuItem, MenuTypes } from '@/features/module-menu/interfaces/menu';
import { getMenu } from '@/features/module-menu/config/menu-config';
import styles from '@/features/module-menu/components/menu/styles.module.css';
import { usePathname } from 'next/navigation';

export const Menu = ({ isLogin }: { isLogin: boolean }) => {
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
                                className={clsx(styles.link, {
                                    [styles.active]: isActive,
                                })}
                                href={href}
                            >
                                {title}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};
