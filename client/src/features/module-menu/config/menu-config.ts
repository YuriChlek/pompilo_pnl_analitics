import { MenuItem, MenuTypes } from '@/features/module-menu/interfaces/menu';

export const getMenu = (menuType: MenuTypes): Array<MenuItem> => {
    const config: Record<string, Array<MenuItem>> = {
        customer: [
            {
                title: 'Account',
                href: '/customer/account',
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
                title: 'Diary',
                href: '/customer/analise-diary',
            },
            {
                title: 'Dashboard',
                href: '/customer/dashboard',
            },
        ],
        guest: [],
    };
    return config[menuType];
};
