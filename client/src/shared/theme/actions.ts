'use server';

import { cookies } from 'next/headers';
import { THEME_COOKIE, THEME_COOKIE_MAX_AGE } from './constants';
import { isTheme, type Theme } from './types';

export async function persistTheme(theme: Theme) {
    if (!isTheme(theme)) {
        throw new Error('Unsupported theme value');
    }
    const cookieStore = await cookies();
    cookieStore.set({
        name: THEME_COOKIE,
        value: theme,
        maxAge: THEME_COOKIE_MAX_AGE,
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
    });
}
