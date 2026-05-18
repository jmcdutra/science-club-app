import '../global.css';
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { ThemeProvider } from '@react-navigation/native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Appearance, StyleSheet, View } from 'react-native';
import { enableScreens } from 'react-native-screens';
import ViewShot, { releaseCapture, type ViewShotRef } from 'react-native-view-shot';

import { AppProviders } from '@/src/providers/AppProviders';
import { AppSonner } from '@/src/shared/components/ui/AppSonner';
import {
  AppThemeProvider,
  resolveAppColorScheme,
} from '@/src/shared/theme/appTheme';
import { useThemePreferenceStore } from '@/src/shared/theme/themePreference.store';
import {
  DarkNavigationTheme,
  LightNavigationTheme,
} from '@/src/shared/theme/navigationTheme';

enableScreens();

export default function RootLayout() {
  const themePreference = useThemePreferenceStore((state) => state.themePreference);
  const hydrateThemePreference = useThemePreferenceStore((state) => state.hydrate);
  const [systemColorScheme, setSystemColorScheme] = useState(() =>
    resolveAppColorScheme(Appearance.getColorScheme()),
  );
  const [resolvedColorScheme, setResolvedColorScheme] = useState(() =>
    resolveAppColorScheme(Appearance.getColorScheme()),
  );
  const [transitionSnapshotUri, setTransitionSnapshotUri] = useState<
    string | null
  >(null);
  const viewShotRef = useRef<ViewShotRef | null>(null);
  const transitionOpacity = useRef(new Animated.Value(0)).current;
  const activeSchemeRef = useRef(resolvedColorScheme);
  const isTransitioningRef = useRef(false);
  const mountedSnapshotRef = useRef<string | null>(null);

  useEffect(() => {
    void hydrateThemePreference();
  }, [hydrateThemePreference]);

  useEffect(() => {
    activeSchemeRef.current = resolvedColorScheme;
  }, [resolvedColorScheme]);

  useEffect(() => {
    mountedSnapshotRef.current = transitionSnapshotUri;
  }, [transitionSnapshotUri]);

  useEffect(() => {
    return () => {
      if (mountedSnapshotRef.current) {
        releaseCapture(mountedSnapshotRef.current);
      }
    };
  }, []);

  const transitionTheme = useCallback(async (nextScheme: 'light' | 'dark') => {
    isTransitioningRef.current = true;

    let snapshotUri: string | null = null;

    try {
      snapshotUri = (await viewShotRef.current?.capture()) ?? null;
    } catch {
      snapshotUri = null;
    }

    if (snapshotUri) {
      transitionOpacity.setValue(1);
      setTransitionSnapshotUri(snapshotUri);
    }

    setResolvedColorScheme(nextScheme);

    requestAnimationFrame(() => {
      if (!snapshotUri) {
        isTransitioningRef.current = false;
        return;
      }

      Animated.timing(transitionOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        releaseCapture(snapshotUri);
        setTransitionSnapshotUri((currentUri) =>
          currentUri === snapshotUri ? null : currentUri,
        );
        isTransitioningRef.current = false;
      });
    });
  }, [transitionOpacity]);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(resolveAppColorScheme(colorScheme));
    });

    return () => {
      subscription.remove();
    };
  }, [transitionTheme]);

  useEffect(() => {
    const nextScheme =
      themePreference === 'system' ? systemColorScheme : themePreference;

    if (
      nextScheme === activeSchemeRef.current ||
      isTransitioningRef.current
    ) {
      return;
    }

    void transitionTheme(nextScheme);
  }, [systemColorScheme, themePreference, transitionTheme]);

  const activeNavigationTheme =
    resolvedColorScheme === 'light' ? LightNavigationTheme : DarkNavigationTheme;

  return (
    <AppThemeProvider colorScheme={resolvedColorScheme}>
      <View style={styles.container} className={resolvedColorScheme}>
        <ThemeProvider value={activeNavigationTheme}>
          <AppProviders>
            <ViewShot
              options={{ format: 'jpg', quality: 0.72, result: 'tmpfile' }}
              ref={viewShotRef}
              style={styles.container}
            >
              <Slot />
              <AppSonner />
            </ViewShot>
          </AppProviders>
          <StatusBar style={resolvedColorScheme === 'light' ? 'dark' : 'light'} />
        </ThemeProvider>
        {transitionSnapshotUri ? (
          <View pointerEvents="none" style={styles.transitionOverlay}>
            <Animated.Image
              source={{ uri: transitionSnapshotUri }}
              style={[styles.transitionOverlay, { opacity: transitionOpacity }]}
            />
          </View>
        ) : null}
      </View>
    </AppThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  transitionOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
