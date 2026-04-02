import type { MenuTypes } from '@/features/module-menu/enums/menu.enums';

export interface MenuItem {
    title: string;
    href: string;
}

export interface MenuProps {
    menuType: MenuTypes;
}
