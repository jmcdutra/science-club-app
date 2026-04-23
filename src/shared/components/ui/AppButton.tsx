import { PropsWithChildren, ReactNode } from 'react';
import { ActivityIndicator, Pressable, type PressableProps, View } from 'react-native';

import { colors } from '@/src/shared/theme/tokens';
import { cn } from '@/src/shared/utils/cn';

import { AppText } from './AppText';

type AppButtonVariant = 'primary' | 'secondary' | 'ghost';

type AppButtonProps = PropsWithChildren<PressableProps> & {
  variant?: AppButtonVariant;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

const variants: Record<AppButtonVariant, string> = {
  primary: 'bg-brand-primary',
  secondary: 'bg-bg-surface border-border-subtle',
  ghost: 'border-transparent bg-transparent',
};

const textVariants: Record<AppButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-text-main',
  ghost: 'text-brand-primary',
};

export function AppButton({
  children,
  variant = 'primary',
  loading,
  disabled,
  leftIcon,
  rightIcon,
  className,
  ...props
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={cn(
        'min-h-[64px] w-full flex-row items-center justify-center gap-3 rounded-2xl border border-transparent px-6',
        variants[variant],
        isDisabled && 'opacity-50',
        className,
      )}
      style={({ pressed }) => [
        { transform: [{ scale: pressed && !isDisabled ? 0.97 : 1 }] },
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.text.main : colors.brand.primary} />
      ) : (
        <View className="flex-row items-center justify-center gap-2">
          {leftIcon}
          <AppText className={cn('text-center font-sans text-base font-bold tracking-tight', textVariants[variant])}>
            {children}
          </AppText>
          {rightIcon}
        </View>
      )}
    </Pressable>
  );
}
