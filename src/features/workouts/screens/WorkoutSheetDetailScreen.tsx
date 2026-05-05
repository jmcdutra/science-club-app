import { ArrowLeft, CaretRight, ClockCountdown, NotePencil } from 'phosphor-react-native';
import { router, type Href, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppScreen } from '@/src/shared/components/ui/AppScreen';
import { AppText } from '@/src/shared/components/ui/AppText';
import { cn } from '@/src/shared/utils/cn';

import { WorkoutExerciseListItem } from '../components/WorkoutExerciseListItem';
import { getTotalSets, getWorkoutSession, getWorkoutSheet } from '../data/workoutSheets';

export function WorkoutSheetDetailScreen() {
  const { id, sessionId } = useLocalSearchParams<{ id: string; sessionId?: string }>();
  const sheet = getWorkoutSheet(id);
  const session = getWorkoutSession(id, sessionId);
  const sessionExercises = session.exercises.filter(Boolean);
  const totalSets = getTotalSets({ ...session, exercises: sessionExercises });

  return (
    <AppScreen contentClassName="px-5 pb-36 pt-8">
      <View className="mb-8 flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          className="h-14 w-14 items-center justify-center rounded-full border border-border-subtle bg-bg-surface"
          onPress={() => router.back()}
        >
          <ArrowLeft color="#FFFFFF" size={26} weight="bold" />
        </Pressable>
        <View className="flex-1 px-4">
          <AppText className="text-center text-base font-semibold text-text-main">{sheet.title}</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          className="h-14 w-14 items-center justify-center rounded-full border border-border-subtle bg-bg-surface"
          onPress={() => router.push(`/(app)/workouts/${sheet.id}/session?sessionId=${session.id}` as Href)}
        >
          <CaretRight color="#A78BFA" size={23} weight="bold" style={{ marginLeft: 2 }} />
        </Pressable>
      </View>

      <Animated.View entering={FadeInDown.duration(420)}>
        <View className="mb-6 rounded-[32px] border border-border-subtle bg-bg-surface px-5 py-5">
          <View className="mb-5 flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <AppText className="text-sm text-text-muted">{session.type}</AppText>
              <AppText className="mt-2 text-4xl font-semibold leading-tight text-text-main">{session.title}</AppText>
              <AppText className="mt-3 text-base leading-snug text-text-muted">{session.days}</AppText>
            </View>
            <View className="rounded-2xl bg-brand-primary/12 px-3 py-2">
              <AppText className="text-sm font-semibold text-brand-secondary">{session.estimatedMinutes} min</AppText>
            </View>
          </View>

          <View className="flex-row gap-3">
            {[
              { label: 'Exercicios', value: String(sessionExercises.length) },
              { label: 'Series', value: String(totalSets) },
              { label: 'Objetivo', value: sheet.goal },
            ].map((item) => (
              <View key={item.label} className="flex-1 rounded-2xl border border-border-subtle bg-bg-base px-3 py-3">
                <AppText className="text-xs text-text-muted">{item.label}</AppText>
                <AppText className="mt-1 text-base font-semibold text-text-main">{item.value}</AppText>
              </View>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            className="mt-5 min-h-[56px] flex-row items-center justify-center gap-2 rounded-2xl bg-brand-primary px-5"
            onPress={() => router.push(`/(app)/workouts/${sheet.id}/session?sessionId=${session.id}` as Href)}
          >
            <CaretRight color="#FFFFFF" size={18} weight="bold" />
            <AppText className="text-base font-semibold text-white">Abrir treino</AppText>
          </Pressable>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(420)}>
        <View className="mb-4 flex-row items-center justify-between">
          <AppText className="text-3xl font-semibold text-text-main">Exercicios</AppText>
          <View className="flex-row items-center gap-2">
            <ClockCountdown color="#8A8D99" size={18} weight="duotone" />
            <AppText className="text-sm text-text-muted">descanso guiado</AppText>
          </View>
        </View>

        <View className="overflow-hidden rounded-[28px] border border-border-subtle bg-bg-surface">
          {sessionExercises.map((exercise) => (
            <WorkoutExerciseListItem
              key={exercise.id}
              exercise={exercise}
              onPress={() => router.push(`/(app)/workouts/${sheet.id}/session?sessionId=${session.id}&exerciseId=${exercise.id}` as Href)}
            />
          ))}
        </View>
      </Animated.View>

      {sheet.sessions.length > 1 ? (
        <Animated.View entering={FadeInDown.delay(160).duration(420)} className="mt-8">
          <AppText className="mb-3 text-2xl font-semibold text-text-main">Outras fichas do plano</AppText>
          <View className="gap-3">
            {sheet.sessions.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                className={cn(
                  'flex-row items-center rounded-2xl border px-4 py-4',
                  item.id === session.id ? 'border-brand-primary bg-brand-primary/10' : 'border-border-subtle bg-bg-surface',
                )}
                onPress={() => router.push(`/(app)/workouts/${sheet.id}?sessionId=${item.id}` as Href)}
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-bg-base">
                  <NotePencil color="#A78BFA" size={20} weight="duotone" />
                </View>
                <View className="ml-3 flex-1">
                  <AppText className="text-base font-semibold text-text-main">{item.title}</AppText>
                  <AppText className="mt-1 text-sm text-text-muted">{item.days}</AppText>
                </View>
                <CaretRight color="#71717A" size={19} weight="bold" />
              </Pressable>
            ))}
          </View>
        </Animated.View>
      ) : null}
    </AppScreen>
  );
}
