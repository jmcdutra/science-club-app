import { Barbell, CalendarBlank, CaretRight, ClockCountdown, Play } from 'phosphor-react-native';
import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppScreen } from '@/src/shared/components/ui/AppScreen';
import { AppText } from '@/src/shared/components/ui/AppText';

import { ExerciseVisual } from '../components/ExerciseVisual';
import { workoutSheets } from '../data/workoutSheets';

function openSheet(sheetId: string, sessionId?: string) {
  const suffix = sessionId ? `?sessionId=${sessionId}` : '';
  router.push(`/(app)/workouts/${sheetId}${suffix}` as Href);
}

export function WorkoutSheetsScreen() {
  const primarySheet = workoutSheets[0];
  const todaySession = primarySheet.sessions[0];
  const alternateSessions = workoutSheets.flatMap((sheet) =>
    sheet.sessions
      .filter((session) => session.id !== todaySession.id)
      .map((session) => ({ sheet, session })),
  );

  return (
    <AppScreen contentClassName="px-5 pb-32 pt-10">
      <Animated.View entering={FadeInDown.duration(450)}>
        <View className="mb-8 flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <AppText className="text-sm text-text-muted">Science Club</AppText>
            <AppText className="mt-2 text-5xl font-semibold leading-tight text-text-main">Treinos</AppText>
          </View>
          <View className="rounded-2xl border border-border-subtle bg-bg-surface px-4 py-3">
            <AppText className="text-xs text-text-muted">Semana</AppText>
            <AppText className="mt-1 text-lg font-semibold text-text-main">4/4</AppText>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          className="mb-7 overflow-hidden rounded-[32px] border border-brand-primary/35 bg-brand-primary px-6 py-6"
          onPress={() => router.push(`/(app)/workouts/${primarySheet.id}/session?sessionId=${todaySession.id}` as Href)}
        >
          <View className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
          <View className="mb-8 flex-row items-center justify-between">
            <View className="rounded-full bg-white/15 px-3 py-1.5">
              <AppText className="text-xs font-semibold text-white">Treino de hoje</AppText>
            </View>
            <View className="flex-row items-center gap-2">
              <ClockCountdown color="#FFFFFF" size={18} weight="duotone" />
              <AppText className="text-sm font-semibold text-white">{todaySession.estimatedMinutes} min</AppText>
            </View>
          </View>

          <View className="flex-row items-end justify-between gap-5">
            <View className="flex-1">
              <AppText className="text-3xl font-semibold leading-tight text-white">{todaySession.title}</AppText>
              <AppText className="mt-3 text-base leading-snug text-white/75">
                {todaySession.type} - {todaySession.exercises.length} exercicios - {todaySession.days}
              </AppText>
            </View>
            <View className="h-16 w-16 items-center justify-center rounded-full bg-white">
              <Play color="#7C3AED" size={28} weight="fill" style={{ marginLeft: 3 }} />
            </View>
          </View>
        </Pressable>

        <View className="mb-8 rounded-[24px] border border-border-subtle bg-bg-surface px-5 py-4">
          <View className="flex-row items-center gap-3">
            <CalendarBlank color="#A78BFA" size={22} weight="duotone" />
            <View className="flex-1">
              <AppText className="text-base font-semibold text-text-main">Proxima reavaliacao</AppText>
              <AppText className="mt-1 text-sm text-text-muted">Em 7 dias, com fotos e comentario do bloco.</AppText>
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(450)} className="mb-10">
        <View className="mb-4 flex-row items-center justify-between">
          <AppText className="text-2xl font-semibold text-text-main">Outros treinos</AppText>
          <AppText className="text-sm text-text-muted">comece quando precisar</AppText>
        </View>

        <View className="gap-3">
          {alternateSessions.map(({ sheet, session }) => (
            <Pressable
              key={`${sheet.id}-${session.id}`}
              accessibilityRole="button"
              className="flex-row items-center rounded-[24px] border border-border-subtle bg-bg-surface px-4 py-4"
              onPress={() => router.push(`/(app)/workouts/${sheet.id}/session?sessionId=${session.id}` as Href)}
            >
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/12">
                <Barbell color="#A78BFA" size={22} weight="duotone" />
              </View>
              <View className="ml-4 flex-1">
                <AppText className="text-lg font-semibold text-text-main">{session.title}</AppText>
                <AppText className="mt-1 text-sm text-text-muted">{sheet.title} - {session.days}</AppText>
              </View>
              <CaretRight color="#71717A" size={20} weight="bold" />
            </Pressable>
          ))}
        </View>
      </Animated.View>

      <View className="gap-8">
        <AppText className="text-2xl font-semibold text-text-main">Fichas ativas</AppText>
        {workoutSheets.map((sheet, sheetIndex) => (
          <Animated.View key={sheet.id} entering={FadeInDown.delay(140 + sheetIndex * 80).duration(450)}>
            <Pressable
              accessibilityRole="button"
              className="rounded-[28px] border border-border-subtle bg-bg-surface px-5 py-5"
              onPress={() => openSheet(sheet.id, sheet.sessions[0]?.id)}
            >
              <View className="mb-5 flex-row items-start justify-between gap-4">
                <View className="flex-1">
                  <AppText className="text-sm text-text-muted">{sheet.level} - {sheet.goal}</AppText>
                  <AppText className="mt-2 text-2xl font-semibold leading-tight text-text-main">{sheet.title}</AppText>
                  <AppText className="mt-2 text-sm text-text-muted">{sheet.coach} - atualizado {sheet.updatedAt}</AppText>
                </View>
                <View className="rounded-2xl bg-bg-base px-3 py-2">
                  <AppText className="text-sm font-semibold text-brand-secondary">{sheet.sessions.length} fichas</AppText>
                </View>
              </View>

              <View className="gap-3">
                {sheet.sessions.map((session) => (
                  <Pressable
                    key={session.id}
                    accessibilityRole="button"
                    className="flex-row items-center rounded-2xl border border-border-subtle bg-bg-base px-4 py-4"
                    onPress={() => openSheet(sheet.id, session.id)}
                  >
                    <ExerciseVisual muscle={session.muscles[0] ?? 'Core'} />
                    <View className="ml-4 flex-1">
                      <AppText className="text-xl font-semibold text-text-main">{session.title}</AppText>
                      <AppText className="mt-1 text-sm text-text-muted">{session.type} - {session.days}</AppText>
                    </View>
                    <CaretRight color="#71717A" size={20} weight="bold" />
                  </Pressable>
                ))}
              </View>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </AppScreen>
  );
}
