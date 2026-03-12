export interface MenuItem {
    title: string;
    href: string;
}

export interface MenuProps {
    menuType: MenuTypes;
}

export enum MenuTypes {
    CUSTOMER = 'customer',
    GUEST = 'guest',
}
