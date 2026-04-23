export const colors = {
  brand: {
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    accent: '#6366F1',
  },
  bg: {
    base: '#000000',
    surface: '#111111',
    elevated: '#171717',
  },
  border: {
    subtle: '#222222',
    focus: '#8B5CF6',
  },
  text: {
    main: '#FFFFFF',
    muted: '#888888',
    soft: '#C4C4CC',
    inverse: '#09090B',
  },
  state: {
    danger: '#EF4444',
    success: '#22C55E',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const fonts = {
  sans: 'Inter',
  heading: 'Outfit',
} as const;

export const theme = {
  colors,
  spacing,
  radii,
  fonts,
} as const;
