import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ThemeContextProvider, useAppTheme } from '@/hooks/theme-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutContent() {
  const { theme } = useAppTheme();

  return (
    <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeContextProvider>
      <RootLayoutContent />
    </ThemeContextProvider>
  );
}
