import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: 'dark' | 'light';
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        return (localStorage.getItem('theme') as Theme) || 'dark';
    });

    const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

    useEffect(() => {
        const resolve = () => {
            if (theme === 'system') {
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            return theme;
        };

        const resolved = resolve();
        setResolvedTheme(resolved);

        document.documentElement.classList.toggle('dark', resolved === 'dark');
        document.documentElement.classList.toggle('light', resolved === 'light');
        document.documentElement.setAttribute('data-theme', resolved);
    }, [theme]);

    useEffect(() => {
        if (theme !== 'system') return;
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
            const resolved = media.matches ? 'dark' : 'light';
            setResolvedTheme(resolved);
            document.documentElement.classList.toggle('dark', resolved === 'dark');
            document.documentElement.classList.toggle('light', resolved === 'light');
            document.documentElement.setAttribute('data-theme', resolved);
        };
        media.addEventListener('change', handler);
        return () => media.removeEventListener('change', handler);
    }, [theme]);

    const setTheme = (t: Theme) => {
        localStorage.setItem('theme', t);
        setThemeState(t);
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}
