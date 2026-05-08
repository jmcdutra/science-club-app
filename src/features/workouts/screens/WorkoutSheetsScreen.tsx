import { Barbell, CaretRight, Clock, Play } from 'phosphor-react-native';
import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppShell } from '@/src/shared/components/layout/AppShell';
import { AppText } from '@/src/shared/components/ui/AppText';
import { useAppTheme } from '@/src/shared/theme/appTheme';

import { workoutSheets } from '../data/workoutSheets';

export function WorkoutSheetsScreen() {
  const { isDark } = useAppTheme();
  const primarySheet = workoutSheets[0];
  const todaySession = primarySheet.sessions[0];
  const alternateSessions = workoutSheets.flatMap((sheet) =>
    sheet.sessions
      .filter((session) => session.id !== todaySession.id)
      .map((session) => ({ sheet, session })),
  );

  return (
    <AppShell title="SEUS TREINOS" largeTitle contentClassName="pb-32">
      {/* Today's Workout — hero card */}
      <Animated.View entering={FadeInDown.delay(200).duration(800)} className="mb-14">
        <Pressable
          accessibilityRole="button"
          className="overflow-hidden rounded-[40px] bg-brand-primary px-8 py-8 relative"
          onPress={() => router.push(`/(app)/workouts/${primarySheet.id}/session?sessionId=${todaySession.id}` as Href)}
        >
          <View className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/8" />
          <View className="absolute right-10 bottom-6 opacity-[0.06]">
            <Barbell size={140} color="#FFFFFF" weight="fill" />
          </View>

          <View className="flex-row justify-between items-center mb-8 z-10">
            <View className="bg-white/15 px-4 py-1.5 rounded-full">
              <AppText className="text-[11px] font-bold uppercase tracking-widest text-white/90">Treino de Hoje</AppText>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Clock size={16} color="#FFFFFF" weight="bold" />
              <AppText className="text-sm font-semibold text-white">{todaySession.estimatedMinutes}min</AppText>
            </View>
          </View>

          <View className="flex-row items-end justify-between gap-5 z-10">
            <View className="flex-1">
              <AppText className="font-heading text-4xl font-bold leading-tight text-white tracking-tight">
                {todaySession.title}
              </AppText>
              <AppText className="mt-2 text-base text-white/60">
                {todaySession.exercises.length} exercícios • {todaySession.days}
              </AppText>
            </View>
            <View className="h-16 w-16 items-center justify-center rounded-full bg-white">
              <Play color="#7C3AED" size={28} weight="fill" style={{ marginLeft: 3 }} />
            </View>
          </View>
        </Pressable>
      </Animated.View>

      {/* Other sessions */}
      <Animated.View entering={FadeInDown.delay(400).duration(800)}>
        <View className="flex-row items-end justify-between border-b border-border-subtle pb-4 mb-6">
          <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">
            Outros Treinos
          </AppText>
          <AppText className="text-xs text-text-muted">{alternateSessions.length} disponíveis</AppText>
        </View>

        <View className="gap-1">
          {alternateSessions.map(({ sheet, session }, index) => (
            <Pressable
              key={`${sheet.id}-${session.id}`}
              accessibilityRole="button"
              className="flex-row items-center py-5"
              style={index < alternateSessions.length - 1 ? { borderBottomWidth: 1, borderBottomColor: isDark ? '#1A1A1A' : '#F3F4F6' } : undefined}
              onPress={() => router.push(`/(app)/workouts/${sheet.id}/session?sessionId=${session.id}` as Href)}
            >
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10">
                <Barbell color="#A78BFA" size={22} weight="duotone" />
              </View>
              <View className="ml-4 flex-1">
                <AppText className="text-lg font-semibold text-text-main">{session.title}</AppText>
                <AppText className="mt-1 text-sm text-text-muted">
                  {sheet.title} • {session.estimatedMinutes}min
                </AppText>
              </View>
              <CaretRight color={isDark ? '#555555' : '#9CA3AF'} size={18} weight="bold" />
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </AppShell>
  );
}
