export type Theme = 'light' | 'dark';
export type ThemeMode = Theme | 'system';

export interface ThemeContextValue {
    mode: ThemeMode;
    resolvedTheme: Theme;
    isReady: boolean;
    setMode: (mode: ThemeMode) => void;
}
