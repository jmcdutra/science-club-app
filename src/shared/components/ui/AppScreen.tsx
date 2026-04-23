import { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/src/shared/theme/tokens';
import { cn } from '@/src/shared/utils/cn';

type AppScreenProps = PropsWithChildren<ScrollViewProps> & {
  scroll?: boolean;
  keyboard?: boolean;
  hideGlow?: boolean;
  contentClassName?: string;
};

export function AppScreen({
  children,
  scroll = true,
  keyboard = true,
  hideGlow = false,
  className,
  contentClassName,
  ...props
}: AppScreenProps) {
  const content = scroll ? (
    <ScrollView
      alwaysBounceVertical={false}
      bounces
      className={cn('flex-1', className)}
      contentContainerClassName={cn('grow', contentClassName)}
      decelerationRate="fast"
      keyboardShouldPersistTaps="handled"
      overScrollMode="never"
      showsVerticalScrollIndicator={false}
      {...props}
    >
      {children}
    </ScrollView>
  ) : (
    <View className={cn('flex-1', className, contentClassName)}>{children}</View>
  );

  return (
    <View className="flex-1 bg-bg-base relative">
      {!hideGlow && (
        <View 
          pointerEvents="none" 
          className="absolute -top-[35%] -left-[25%] w-[150%] h-[60%] rounded-full opacity-20 bg-brand-primary/30"
          style={{ transform: [{ scale: 1.2 }] }}
        />
      )}
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeAreaContext}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' && keyboard ? 'padding' : undefined}
          style={styles.keyboard}
        >
          {content}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeAreaContext: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
});
