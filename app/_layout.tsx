import '../global.css';
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { enableScreens } from 'react-native-screens';

import { AppProviders } from '@/src/providers/AppProviders';
import { AppLoader } from '@/src/shared/components/ui/AppLoader';
import { useColorScheme, colorScheme } from 'nativewind';
import { LightNavigationTheme, DarkNavigationTheme } from '@/src/shared/theme/navigationTheme';

// Force system theme synchronization
colorScheme.set('system');

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    const prepare = async () => {
      // Simulate splash screen fade
      await new Promise((resolve) => setTimeout(resolve, 1800));
      setIsReady(true);
      await SplashScreen.hideAsync();
    };

    prepare();
  }, []);

  if (!isReady) {
    return <AppLoader fullScreen />;
  }

  // Fallback to dark if not resolved yet, or follow system
  const activeNavigationTheme = colorScheme === 'light' ? LightNavigationTheme : DarkNavigationTheme;

  return (
    <View style={{ flex: 1 }} className={colorScheme}>
      <ThemeProvider value={activeNavigationTheme}>
        <AppProviders>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(public)" />
            <Stack.Screen name="(app)" />
          </Stack>
        </AppProviders>
        <StatusBar style={colorScheme === 'light' ? "dark" : "light"} />
      </ThemeProvider>
    </View>
  );
}

import { View } from 'react-native';

