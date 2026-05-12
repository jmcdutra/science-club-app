import { PropsWithChildren, ReactNode } from 'react';
import { ActivityIndicator, Pressable, type PressableProps, View } from 'react-native';

import { colors } from '@/src/shared/theme/tokens';
import { cn } from '@/src/shared/utils/cn';
import { AppText } from './AppText';

export type AppButtonVariant = 'primary' | 'ghost' | 'tonal' | 'danger' | 'secondary';
export type AppButtonSize = 'md' | 'sm' | 'icon';

type AppButtonProps = PropsWithChildren<PressableProps> & {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

const VARIANTS: Record<AppButtonVariant, string> = {
  primary: 'bg-brand-primary border-transparent',
  secondary: 'bg-bg-surface border-border-subtle',
  ghost: 'bg-transparent border-transparent',
  tonal: 'bg-brand-secondary/10 border-transparent',
  danger: 'bg-red-500/10 border-red-500/20',
};

const TEXT_VARIANTS: Record<AppButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-text-main',
  ghost: 'text-brand-primary',
  tonal: 'text-brand-primary',
  danger: 'text-red-400',
};

const SIZES: Record<AppButtonSize, string> = {
  md: 'h-[52px] rounded-[14px] px-4',
  sm: 'h-10 rounded-[11px] px-[14px]',
  icon: 'h-11 w-11 rounded-xl px-0',
};

const ICON_SLOT_WIDTH: Record<Exclude<AppButtonSize, 'icon'>, number> = {
  md: 20,
  sm: 16,
};

function IconSlot({ icon, width }: { icon?: ReactNode; width: number }) {
  return (
    <View
      className="items-center justify-center"
      style={{ width, opacity: icon ? 1 : 0 }}
    >
      {icon ?? <View />}
    </View>
  );
}

export function AppButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading,
  disabled,
  leftIcon,
  rightIcon,
  className,
  ...props
}: AppButtonProps) {
  const isDisabled = disabled || loading;
  const hasIcons = Boolean(leftIcon || rightIcon);
  const isIconOnly = size === 'icon';
  const slotWidth = !isIconOnly ? ICON_SLOT_WIDTH[size] : 0;

  const renderLabel = () => {
    if (typeof children === 'string' || typeof children === 'number') {
      return (
        <AppText className={cn('text-center font-sans font-semibold tracking-tight', TEXT_VARIANTS[variant], size === 'sm' ? 'text-[13px]' : 'text-[15px]')}>
          {children}
        </AppText>
      );
    }

    return children;
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center border overflow-hidden',
        fullWidth || (size === 'md' && !isIconOnly) ? 'w-full' : null,
        SIZES[size],
        VARIANTS[variant],
        variant === 'primary' && !isDisabled ? 'shadow-lg shadow-brand-primary/30' : null,
        isDisabled ? 'bg-[#1A1A1A] border-transparent opacity-50' : null,
        className,
      )}
      style={({ pressed }) => [{ transform: [{ scale: pressed && !isDisabled ? 0.97 : 1 }] }]}
      {...props}
    >
      {variant === 'primary' && !isDisabled && (
        <View
          pointerEvents="none"
          className="absolute left-0 right-0 top-0 h-px"
          style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
        />
      )}
      {variant === 'primary' && !isDisabled && (
        <View
          pointerEvents="none"
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ backgroundColor: 'rgba(0,0,0,0.20)' }}
        />
      )}

      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.text.main : colors.brand.primary} size="small" />
      ) : isIconOnly ? (
        renderLabel()
      ) : (
        <View
          className="w-full flex-row items-center justify-center"
        >
          {hasIcons ? <IconSlot icon={leftIcon} width={slotWidth} /> : null}
          <View className={cn('items-center justify-center', hasIcons ? 'flex-1 px-2' : null)}>
            {renderLabel()}
          </View>
          {hasIcons ? <IconSlot icon={rightIcon} width={slotWidth} /> : null}
        </View>
      )}
    </Pressable>
  );
}
