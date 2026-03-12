'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { PREFERS_DARK_QUERY, THEME_CLASS_DARK, THEME_STORAGE_KEY } from './constants';
import { ThemeContext } from './ThemeContext';
import type { Theme, ThemeMode } from './types';

const validMode = (value: string | null): ThemeMode | null => {
    if (value === 'light' || value === 'dark' || value === 'system') {
        return value;
    }
    return null;
};

const resolveTheme = (mode: ThemeMode, prefersDark: boolean): Theme => {
    if (mode === 'system') {
        return prefersDark ? 'dark' : 'light';
    }
    return mode;
};

const updateDom = (mode: ThemeMode, resolved: Theme) => {
    if (typeof document === 'undefined') {
        return;
    }
    const root = document.documentElement;
    root.dataset.theme = resolved;
    root.dataset.themeMode = mode;
    root.classList.toggle(THEME_CLASS_DARK, resolved === 'dark');
    root.style.colorScheme = resolved;
};

const getStoredMode = (): ThemeMode | null => {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        return validMode(stored);
    } catch {
        return null;
    }
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [mode, setModeState] = useState<ThemeMode>('system');
    const [resolvedTheme, setResolvedTheme] = useState<Theme>('light');
    const [systemPrefersDark, setSystemPrefersDark] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }
        const media = window.matchMedia(PREFERS_DARK_QUERY);

        const datasetMode = validMode(document.documentElement.dataset.themeMode ?? null);
        const storedMode = getStoredMode();
        const initialMode = storedMode ?? datasetMode ?? 'system';
        const prefersDark = media.matches;
        const initialResolved = resolveTheme(initialMode, prefersDark);

        setModeState(initialMode);
        setResolvedTheme(initialResolved);
        setSystemPrefersDark(prefersDark);
        updateDom(initialMode, initialResolved);
        setIsReady(true);

        const handleChange = (event: MediaQueryListEvent) => {
            setSystemPrefersDark(event.matches);
        };

        if (typeof media.addEventListener === 'function') {
            media.addEventListener('change', handleChange);
            return () => media.removeEventListener('change', handleChange);
        }

        media.addListener(handleChange);
        return () => media.removeListener(handleChange);
    }, []);

    useEffect(() => {
        if (!isReady) {
            return;
        }
        const nextResolved = resolveTheme(mode, systemPrefersDark);
        setResolvedTheme(nextResolved);
        updateDom(mode, nextResolved);

        try {
            localStorage.setItem(THEME_STORAGE_KEY, mode);
        } catch {
            /* Swallow quota/security errors */
        }
    }, [mode, systemPrefersDark, isReady]);

    const setThemeMode = useCallback((next: ThemeMode) => {
        setModeState(next);
    }, []);

    const value = useMemo(
        () => ({
            mode,
            resolvedTheme,
            isReady,
            setMode: setThemeMode,
        }),
        [mode, resolvedTheme, isReady, setThemeMode],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
