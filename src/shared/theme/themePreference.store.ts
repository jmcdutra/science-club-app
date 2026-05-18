import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import type { AppColorScheme } from './appTheme';

export type AppThemePreference = 'system' | AppColorScheme;

const THEME_PREFERENCE_KEY = 'science-club.theme-preference';

type ThemePreferenceState = {
  hydrated: boolean;
  themePreference: AppThemePreference;
  hydrate: () => Promise<void>;
  setThemePreference: (themePreference: AppThemePreference) => Promise<void>;
};

export const useThemePreferenceStore = create<ThemePreferenceState>((set) => ({
  hydrated: false,
  themePreference: 'system',
  hydrate: async () => {
    const stored = await SecureStore.getItemAsync(THEME_PREFERENCE_KEY);
    const nextPreference =
      stored === 'light' || stored === 'dark' || stored === 'system'
        ? stored
        : 'system';

    set({
      hydrated: true,
      themePreference: nextPreference,
    });
  },
  setThemePreference: async (themePreference) => {
    await SecureStore.setItemAsync(THEME_PREFERENCE_KEY, themePreference);
    set({ themePreference });
  },
}));
