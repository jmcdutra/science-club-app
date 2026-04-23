import { forwardRef, ReactNode, useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { cn } from '@/src/shared/utils/cn';

import { AppText } from './AppText';

type AppInputProps = TextInputProps & {
  label: string;
  error?: string;
  rightElement?: ReactNode;
};

export const AppInput = forwardRef<TextInput, AppInputProps>(function AppInput(
  { label, error, rightElement, className, onFocus, onBlur, ...props },
  ref,
) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="gap-2">
      <AppText className="ml-1 opacity-60 uppercase tracking-[0.2em] text-[10px] font-bold text-text-muted">{label}</AppText>
      <View
        className={cn(
          'min-h-[64px] flex-row items-center rounded-2xl border-2 px-5 w-full',
          error 
            ? 'border-red-500/50 bg-red-500/5' 
            : isFocused 
              ? 'border-brand-primary bg-bg-base' 
              : 'border-border-subtle bg-bg-surface',
        )}
      >
        <TextInput
          ref={ref}
          className={cn('min-h-[64px] flex-1 font-sans text-base font-medium text-text-main', className)}
          cursorColor="#8B5CF6"
          placeholderTextColor="var(--color-text-muted)"
          selectionColor="#8B5CF6"
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {rightElement}
      </View>
      {error ? <AppText className="ml-1 text-red-500 text-xs font-medium">{error}</AppText> : null}
    </View>
  );
});
