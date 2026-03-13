'use client';

import { useState } from 'react';
import styles from '@/components/theme-button/styles.module.css';
import type { Theme } from '@/shared/theme/types';
import { persistTheme } from '@/shared/theme/actions';
import { getCookie } from 'cookies-next';

export const ThemeButton = () => {
    const [theme, setTheme] = useState<Theme>();

    const handleToggle = async () => {
        const currentTheme = await getCookie('theme');
        const updatedTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';

        setTheme(updatedTheme);

        await persistTheme(updatedTheme);
    };

    const label = theme === 'light' ? '☀️ Light' : '🌙 Dark';

    return (
        <button
            className={styles.toggleThemeButton}
            type="button"
            onClick={handleToggle}
            aria-label="Toggle between light and dark theme"
        >
            {label}
        </button>
    );
};
