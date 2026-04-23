import { PropsWithChildren } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppLogo } from '@/src/shared/components/ui/AppLogo';
import { AppText } from '@/src/shared/components/ui/AppText';
import { colors } from '@/src/shared/theme/tokens';
import { cn } from '@/src/shared/utils/cn';

import { AnimatedScreenContent } from './AnimatedScreenContent';

type AppShellProps = PropsWithChildren<{
  greeting?: string;
  title: string;
  contentClassName?: string;
}>;

export function AppShell({ children, greeting = 'Bom dia', title, contentClassName }: AppShellProps) {
  const currentDate = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });

  return (
    <View className="flex-1 bg-bg-base">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ScrollView
          alwaysBounceVertical={false}
          bounces
          contentContainerClassName={cn("px-6 pb-32 pt-20", contentClassName)}
          decelerationRate="fast"
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        >
          <AnimatedScreenContent>
            <View className="mb-14">
              <AppText className="text-text-muted text-xs font-bold tracking-[0.3em] uppercase mb-3">
                {currentDate}
              </AppText>
              <AppText className="font-heading text-5xl font-semibold text-text-main tracking-tighter leading-[1.05]">
                {greeting},{'\n'}{title}.
              </AppText>
            </View>
            {children}
          </AnimatedScreenContent>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
