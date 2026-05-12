import { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cn } from '@/src/shared/utils/cn';

import { AnimatedScreenContent } from './AnimatedScreenContent';
import { ScreenHeader } from './ScreenHeader';

type AppShellProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
  contentClassName?: string;
  /** @deprecated – ignored, kept for backward compat */
  greeting?: string;
}>;

export function AppShell({ children, title, subtitle, rightAction, contentClassName }: AppShellProps) {
  return (
    <View className="flex-1 bg-bg-base">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ScreenHeader title={title} subtitle={subtitle} rightAction={rightAction} />

        <ScrollView
          alwaysBounceVertical={false}
          bounces
          contentContainerClassName={cn('px-6 pb-36 pt-4', contentClassName)}
          decelerationRate="fast"
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        >
          <AnimatedScreenContent>{children}</AnimatedScreenContent>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
