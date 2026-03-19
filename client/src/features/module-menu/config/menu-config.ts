import { MenuItem, MenuTypes } from '@/features/module-menu/interfaces/menu';

export const getMenu = (menuType: MenuTypes): Array<MenuItem> => {
    const config: Record<string, Array<MenuItem>> = {
        customer: [
            {
                title: 'Dashboard',
                href: '/customer/dashboard',
            },
            {
                title: 'API Keys',
                href: '/customer/api-keys',
            },
            {
                title: 'Trading Accounts',
                href: '/customer/trading-account',
            },
            {
                title: 'Trading strategies',
                href: '/customer/trading-strategies',
            },
            {
                title: 'Diary',
                href: '/customer/analise-diary',
            },
            {
                title: 'Account',
                href: '/customer/account',
            },
        ],
        guest: [
            {
                title: 'Home Page',
                href: '/',
            },
            {
                title: 'About',
                href: '/about',
            },
            {
                title: 'Analytics',
                href: '/analytics',
            },
        ],
    };
    return config[menuType];
};
