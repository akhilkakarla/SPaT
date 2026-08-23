import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

type ThemeScheme = 'light' | 'dark';

type ThemeContextType = {
  theme: ThemeScheme;
  setTheme: (theme: ThemeScheme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeContextProvider({
  children,
  initialScheme,
}: {
  children: ReactNode;
  initialScheme?: ThemeScheme;
}) {
  const systemColorScheme = useRNColorScheme() ?? 'light';
  const [theme, setTheme] = useState<ThemeScheme>(initialScheme ?? systemColorScheme);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within ThemeContextProvider');
  }

  return context;
}
