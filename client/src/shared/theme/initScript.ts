import { PREFERS_DARK_QUERY, THEME_CLASS_DARK, THEME_STORAGE_KEY } from './constants';

export const themeInitScript = `(() => {
    const storageKey = '${THEME_STORAGE_KEY}';
    const classDark = '${THEME_CLASS_DARK}';
    const prefersDarkQuery = '${PREFERS_DARK_QUERY}';
    const doc = document;
    const root = doc.documentElement;
    const prefersDark = () => window.matchMedia(prefersDarkQuery).matches;

    const setDataset = (mode, resolved) => {
        root.dataset.theme = resolved;
        root.dataset.themeMode = mode;
        root.classList.toggle(classDark, resolved === 'dark');
        root.style.colorScheme = resolved;
    };

    const getStoredMode = () => {
        try {
            const stored = localStorage.getItem(storageKey);
            return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : null;
        } catch {
            return null;
        }
    };

    const persistMode = (mode) => {
        try {
            localStorage.setItem(storageKey, mode);
        } catch {
            /* ignore */
        }
    };

    const mode = getStoredMode() ?? root.dataset.themeMode ?? 'system';
    const resolved = mode === 'system' ? (prefersDark() ? 'dark' : 'light') : mode;

    setDataset(mode, resolved);
    persistMode(mode);
})();`;
