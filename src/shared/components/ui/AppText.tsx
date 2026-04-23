import { Text, type TextProps } from 'react-native';

import { cn } from '@/src/shared/utils/cn';

type AppTextVariant = 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'label' | 'error';

type AppTextProps = TextProps & {
  variant?: AppTextVariant;
};

const variants: Record<AppTextVariant, string> = {
  display: 'font-heading text-4xl font-semibold leading-tight text-text-main',
  title: 'font-heading text-2xl font-semibold leading-tight text-text-main',
  subtitle: 'font-heading text-lg font-medium leading-snug text-text-main',
  body: 'font-sans text-base leading-relaxed text-text-soft',
  caption: 'font-sans text-sm leading-snug text-text-muted',
  label: 'font-sans text-xs font-semibold uppercase text-text-muted',
  error: 'font-sans text-xs font-medium text-red-400',
};

export function AppText({ variant = 'body', className, ...props }: AppTextProps) {
  return <Text className={cn(variants[variant], className)} {...props} />;
}
