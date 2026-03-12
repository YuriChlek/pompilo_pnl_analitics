'use client';

import styles from './styles.module.css';
import { useEffect, useState } from 'react';

export const ThemeButton = () => {
    const defaultTheme = 'dark';
    const [theme, setTheme] = useState<'light' | 'dark'>();

    const toggleTheme = () => {
        const next: 'light' | 'dark' = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        document.documentElement.dataset.theme = next;
        localStorage.setItem('theme', next);
    };

    const initTheme = () => {
        const userTheme = (localStorage.getItem('theme') as 'light' | 'dark') || defaultTheme;
        setTheme(userTheme);
        localStorage.setItem('theme', userTheme);
        document.documentElement.dataset.theme = userTheme;
    };

    useEffect(() => {
        requestAnimationFrame(initTheme);
    }, []);

    return (
        <button className={styles.toggleThemeButton} onClick={toggleTheme}>
            {theme === 'light' ? '☀️ Light' : '🌙 Dark'}
        </button>
    );
};
