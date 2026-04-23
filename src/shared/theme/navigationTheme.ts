import { DefaultTheme, DarkTheme, type Theme } from '@react-navigation/native';

export const LightNavigationTheme: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: '#7C3AED',
    background: '#FFFFFF',
    card: '#F9FAFB',
    text: '#111827',
    border: '#E5E7EB',
    notification: '#8B5CF6',
  },
};

export const DarkNavigationTheme: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: '#8B5CF6',
    background: '#000000',
    card: '#111111',
    text: '#FFFFFF',
    border: '#222222',
    notification: '#8B5CF6',
  },
};
