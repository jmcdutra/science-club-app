import { ArrowLeft, CaretRight, Clock, Play } from 'phosphor-react-native';
import { router, type Href, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { AppText } from '@/src/shared/components/ui/AppText';
import { useAppTheme } from '@/src/shared/theme/appTheme';
import { cn } from '@/src/shared/utils/cn';
import { useAuthStore } from '@/src/features/auth/services/auth.store';

import { WorkoutExerciseListItem } from '../components/WorkoutExerciseListItem';
import { getTotalSets, getWorkoutSession, getWorkoutSheet } from '../data/workoutSheets';
import { getCurrentWorkout } from '../api/workouts';

const MUSCLE_COLOR: Record<string, string> = {
  Abdomen: '#8B5CF6', Core: '#8B5CF6',
  Quadriceps: '#F59E0B', Pernas: '#F59E0B',
  Dorsais: '#38BDF8', Biceps: '#A78BFA',
  Triceps: '#C084FC', Peitoral: '#FF6B9A',
  Posterior: '#FFB86B', Ombros: '#7DD3FC',
  Gluteos: '#FB7185', Panturrilhas: '#FCD34D',
};

export function WorkoutSheetDetailScreen() {
  const { id, sessionId } = useLocalSearchParams<{ id: string; sessionId?: string }>();
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { session: authSession } = useAuthStore();
  const { data } = useQuery({
    queryKey: ['student-workout-current'],
    queryFn: () => getCurrentWorkout(authSession?.token!),
    enabled: !!authSession?.token,
  });
  const remoteSheet = data?.workout && data.workout.id === id ? data.workout : null;
  const sheet = remoteSheet || getWorkoutSheet(id);
  const session = remoteSheet
    ? (sheet.sessions.find((s) => s.id === sessionId) || sheet.sessions[0])
    : getWorkoutSession(id, sessionId);
  const sessionExercises = session.exercises.filter(Boolean);
  const totalSets = getTotalSets({ ...session, exercises: sessionExercises });
  const muscles = [...new Set(sessionExercises.map((e) => e.muscle))];

  return (
    <View className="flex-1 bg-bg-base">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ScrollView
          alwaysBounceVertical={false}
          bounces
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 32,
            paddingBottom: 136 + Math.max(insets.bottom, 12),
          }}
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="mb-10 flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center rounded-full bg-bg-surface border border-border-subtle"
              onPress={() => router.back()}
            >
              <ArrowLeft color={isDark ? '#FFFFFF' : '#111827'} size={20} weight="bold" />
            </Pressable>
            <AppText className="text-[11px] font-bold uppercase tracking-[0.25em] text-text-muted">
              {sheet.title}
            </AppText>
            <View className="w-11" />
          </View>

          {/* Session info */}
          <Animated.View entering={FadeInDown.springify().damping(22).stiffness(180)}>
            <AppText className="text-[11px] font-bold uppercase tracking-[0.25em] text-text-muted mb-3">
              {session.type} · {session.days}
            </AppText>
            <AppText className="font-heading text-3xl font-bold text-text-main mb-6">
              {session.title}
            </AppText>

            {/* Stats inline — sem card */}
            <View className="flex-row items-center gap-5 mb-6">
              <View className="flex-row items-baseline gap-1">
                <AppText className="text-xl font-bold text-text-main">{sessionExercises.length}</AppText>
                <AppText className="text-xs text-text-muted">exercícios</AppText>
              </View>
              <View className="h-4 w-px bg-border-subtle" />
              <View className="flex-row items-baseline gap-1">
                <AppText className="text-xl font-bold text-text-main">{totalSets}</AppText>
                <AppText className="text-xs text-text-muted">séries val.</AppText>
              </View>
              <View className="h-4 w-px bg-border-subtle" />
              <View className="flex-row items-center gap-1">
                <Clock size={13} color="#666" weight="bold" />
                <AppText className="text-base font-bold text-text-main">{session.estimatedMinutes}min</AppText>
              </View>
            </View>

            {/* Músculos */}
            <View className="flex-row flex-wrap gap-2 mb-2">
              {muscles.map((muscle) => (
                <View
                  key={muscle}
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: `${MUSCLE_COLOR[muscle] ?? '#8B5CF6'}18` }}
                >
                  <AppText
                    className="text-[11px] font-bold"
                    style={{ color: MUSCLE_COLOR[muscle] ?? '#8B5CF6' }}
                  >
                    {muscle}
                  </AppText>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Lista de exercícios */}
          <Animated.View
            entering={FadeInDown.springify().damping(22).stiffness(180).delay(80)}
            className="mt-12"
          >
            <View className="flex-row items-center justify-between border-b border-border-subtle pb-3 mb-1">
              <AppText className="text-[11px] font-bold uppercase tracking-[0.25em] text-text-muted">
                Exercícios
              </AppText>
              <AppText className="text-xs text-text-muted">{sessionExercises.length} no total</AppText>
            </View>
            {sessionExercises.map((exercise) => (
              <WorkoutExerciseListItem
                key={exercise.id}
                exercise={exercise}
                isDark={isDark}
                onPress={() =>
                  router.push(
                    `/(app)/workouts/${sheet.id}/session?sessionId=${session.id}&exerciseId=${exercise.id}` as Href,
                  )
                }
              />
            ))}
          </Animated.View>

          {/* Outros do plano */}
          {sheet.sessions.length > 1 && (
            <Animated.View
              entering={FadeInDown.springify().damping(22).stiffness(180).delay(140)}
              className="mt-12"
            >
              <View className="border-b border-border-subtle pb-3 mb-1">
                <AppText className="text-[11px] font-bold uppercase tracking-[0.25em] text-text-muted">
                  Mesmo Plano
                </AppText>
              </View>
              {sheet.sessions.map((item, index) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  className="flex-row items-center py-4"
                  style={
                    index < sheet.sessions.length - 1
                      ? { borderBottomWidth: 1, borderBottomColor: isDark ? '#1C1C1C' : '#F0F0F0' }
                      : undefined
                  }
                  onPress={() => router.push(`/(app)/workouts/${sheet.id}?sessionId=${item.id}` as Href)}
                >
                  <View
                    className={cn('h-2.5 w-2.5 rounded-full mr-4 flex-shrink-0', item.id === session.id ? 'bg-brand-primary' : 'bg-text-muted/20')}
                  />
                  <View className="flex-1">
                    <AppText
                      className={cn('text-base font-bold', item.id === session.id ? 'text-brand-secondary' : 'text-text-main')}
                    >
                      {item.title}
                    </AppText>
                    <AppText className="mt-0.5 text-xs text-text-muted">
                      {item.days} · {item.estimatedMinutes}min
                    </AppText>
                  </View>
                  {item.id !== session.id && (
                    <CaretRight color={isDark ? '#3D3D3D' : '#CACACA'} size={15} weight="bold" />
                  )}
                </Pressable>
              ))}
            </Animated.View>
          )}
        </ScrollView>

        {/* Sticky CTA */}
        <View
          className="absolute bottom-0 left-0 right-0 px-6 pt-3"
          style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.97)' }}
        >
          <View style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <Pressable
            accessibilityRole="button"
            className="min-h-[56px] flex-row items-center justify-center gap-2.5 rounded-2xl bg-brand-primary"
            onPress={() =>
              router.push(`/(app)/workouts/${sheet.id}/session?sessionId=${session.id}` as Href)
            }
          >
            <Play color="#FFFFFF" size={18} weight="fill" />
            <AppText className="text-base font-bold text-white">Iniciar Treino</AppText>
          </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
