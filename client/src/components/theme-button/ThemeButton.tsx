'use client';

import styles from './styles.module.css';
import { useMemo } from 'react';
import { useTheme } from '@/shared/theme/useTheme';
import type { ThemeMode } from '@/shared/theme/types';

const MODE_SEQUENCE: ThemeMode[] = ['light', 'dark', 'system'];
const MODE_LABEL: Record<ThemeMode, string> = {
    light: '☀️ Light',
    dark: '🌙 Dark',
    system: '🖥️ System',
};

export const ThemeButton = () => {
    const { mode, resolvedTheme, setMode, isReady } = useTheme();

    const nextMode = useMemo(() => {
        const index = MODE_SEQUENCE.indexOf(mode);
        const nextIndex = (index + 1) % MODE_SEQUENCE.length;
        return MODE_SEQUENCE[nextIndex];
    }, [mode]);

    const handleToggle = () => {
        setMode(nextMode);
    };

    const label = MODE_LABEL[mode];
    const resolvedHint = mode === 'system' ? ` (${resolvedTheme})` : '';

    const content = isReady ? (
        <>
            {label}
            {resolvedHint}
        </>
    ) : (
        'Theme'
    );

    return (
        <button
            className={styles.toggleThemeButton}
            onClick={handleToggle}
            aria-label={isReady ? `Switch theme to ${nextMode}` : 'Theme preference'}
            disabled={!isReady}
        >
            {content}
        </button>
    );
};
