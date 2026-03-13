import { cookies } from 'next/headers';
import { THEME_COOKIE } from '../constants';
import { isTheme, type Theme } from '../types';

export const getRequestTheme = async (): Promise<Theme> => {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(THEME_COOKIE)?.value;

    return isTheme(cookieValue) ? cookieValue : 'light';
};
