import { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/src/shared/components/ui/AppText';
import { cn } from '@/src/shared/utils/cn';

import { AnimatedScreenContent } from './AnimatedScreenContent';

type AppShellProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
  contentClassName?: string;
}>;

export function AppShell({ children, title, subtitle, rightAction, contentClassName }: AppShellProps) {
  return (
    <View className="flex-1 bg-bg-base">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        {/* Fixed header */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: 16,
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 1, paddingRight: 16 }}>
            {subtitle ? (
              <AppText
                className="text-[11px] font-bold uppercase tracking-[0.3em] text-text-muted mb-2"
              >
                {subtitle}
              </AppText>
            ) : null}
            <AppText
              className="font-heading text-3xl font-bold text-text-main"
              style={{ letterSpacing: -0.5, lineHeight: 36 }}
            >
              {title}
            </AppText>
          </View>
          {rightAction ?? null}
        </View>

        <ScrollView
          alwaysBounceVertical={false}
          bounces
          contentContainerClassName={cn('px-6 pb-32 pt-2', contentClassName)}
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
