import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
    mode: ThemeMode;
    colors: {
        background: string;
        surface: string;
        primary: string;
        primaryDark: string;
        secondary: string;
        text: string;
        textSecondary: string;
        border: string;
        error: string;
        success: string;
        warning: string;
        gradient: {
            start: string[];
            end: string[];
        };
        tabBar: {
            background: string;
            active: string;
            inactive: string;
            border: string;
        };
        header: {
            background: string;
            text: string;
            border: string;
        };
    };
}

const lightTheme: Theme = {
    mode: 'light',
    colors: {
        background: '#f9fafb',
        surface: '#ffffff',
        primary: '#16a34a',
        primaryDark: '#059669',
        secondary: '#ecfdf5',
        text: '#111827',
        textSecondary: '#6b7280',
        border: '#e5e7eb',
        error: '#ef4444',
        success: '#16a34a',
        warning: '#f59e0b',
        gradient: {
            start: ['#f9fafb', '#ecfdf5', '#dcfce7'],
            end: ['#f0fdf4', '#ffffff', '#dcfce7'],
        },
        tabBar: {
            background: '#ffffff',
            active: '#16a34a',
            inactive: '#8e8e93',
            border: '#e5e7eb',
        },
        header: {
            background: '#ffffff',
            text: '#111827',
            border: '#e5e7eb',
        },
    },
};

const darkTheme: Theme = {
    mode: 'dark',
    colors: {
        background: '#111827',
        surface: '#1f2937',
        primary: '#22c55e',
        primaryDark: '#16a34a',
        secondary: '#064e3b',
        text: '#f9fafb',
        textSecondary: '#9ca3af',
        border: '#374151',
        error: '#f87171',
        success: '#22c55e',
        warning: '#fbbf24',
        gradient: {
            start: ['#111827', '#064e3b', '#065f46'],
            end: ['#1f2937', '#064e3b', '#065f46'],
        },
        tabBar: {
            background: '#1f2937',
            active: '#22c55e',
            inactive: '#6b7280',
            border: '#374151',
        },
        header: {
            background: '#1f2937',
            text: '#f9fafb',
            border: '#374151',
        },
    },
};

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [themeMode, setThemeMode] = useState<ThemeMode>('light');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Wczytaj zapisany motyw
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (savedTheme === 'dark' || savedTheme === 'light') {
                    setThemeMode(savedTheme);
                }
            } catch (error) {
                console.error('Błąd wczytywania motywu:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadTheme();
    }, []);

    const setTheme = async (mode: ThemeMode) => {
        try {
            setThemeMode(mode);
            await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
        } catch (error) {
            console.error('Błąd zapisywania motywu:', error);
        }
    };

    const toggleTheme = () => {
        const newMode = themeMode === 'light' ? 'dark' : 'light';
        setTheme(newMode);
    };

    const theme = themeMode === 'dark' ? darkTheme : lightTheme;

    if (isLoading) {
        // Możesz zwrócić loading screen lub domyślny motyw
        return <>{children}</>;
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

