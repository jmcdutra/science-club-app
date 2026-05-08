import { Clock, Play } from 'phosphor-react-native';
import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppShell } from '@/src/shared/components/layout/AppShell';
import { AppText } from '@/src/shared/components/ui/AppText';
import { useAppTheme } from '@/src/shared/theme/appTheme';

import { workoutSheets } from '../data/workoutSheets';

const MUSCLE_COLOR: Record<string, string> = {
  Abdomen: '#8B5CF6', Core: '#8B5CF6',
  Quadriceps: '#F59E0B', Pernas: '#F59E0B',
  Dorsais: '#38BDF8', Biceps: '#A78BFA',
  Triceps: '#C084FC', Peitoral: '#FF6B9A',
  Posterior: '#FFB86B', Ombros: '#7DD3FC',
  Gluteos: '#FB7185', Panturrilhas: '#FCD34D',
};

export function WorkoutSheetsScreen() {
  const { isDark } = useAppTheme();
  const primarySheet = workoutSheets[0];
  const todaySession = primarySheet.sessions[0];
  const alternateSessions = workoutSheets.flatMap((sheet) =>
    sheet.sessions
      .filter((s) => s.id !== todaySession.id)
      .map((s) => ({ sheet, session: s })),
  );

  const todayMuscles = [...new Set(todaySession.exercises.map((e) => e.muscle))].slice(0, 3);
  const primaryAccent = MUSCLE_COLOR[todayMuscles[0]] ?? '#8B5CF6';
  const previewExercises = todaySession.exercises.slice(0, 3);
  const extraCount = Math.max(0, todaySession.exercises.length - 3);

  const dividerColor = isDark ? '#1E1E1E' : '#EBEBEB';

  return (
    <AppShell title="Seus Treinos" contentClassName="pb-32">

      {/* ─── TREINO DE HOJE ─────────────────────── */}
      <Animated.View entering={FadeInDown.delay(200).duration(600)} className="mb-10">
        <Pressable
          accessibilityRole="button"
          style={{
            borderRadius: 28,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: isDark ? '#232323' : '#E3E3E3',
          }}
          onPress={() =>
            router.push(`/(app)/workouts/${primarySheet.id}/session?sessionId=${todaySession.id}` as Href)
          }
        >
          {/* ── Tinted header ── */}
          <View style={{ backgroundColor: `${primaryAccent}10`, padding: 20, paddingBottom: 16 }}>
            {/* Top row: badge + duration */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <View style={{ backgroundColor: `${primaryAccent}20`, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 }}>
                <AppText className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: primaryAccent }}>
                  Treino de Hoje
                </AppText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Clock size={13} color={isDark ? '#666' : '#999'} weight="bold" />
                <AppText className="text-sm font-bold text-text-muted">{todaySession.estimatedMinutes}min</AppText>
              </View>
            </View>

            {/* Workout name + type */}
            <AppText className="font-heading text-2xl font-bold text-text-main mb-0.5">
              {todaySession.title}
            </AppText>
            <AppText className="text-xs text-text-muted mb-4">
              {todaySession.type} · {todaySession.exercises.length} exercícios
            </AppText>

            {/* Exercise preview list */}
            <View style={{ gap: 6 }}>
              {previewExercises.map((exercise) => {
                const setDef = exercise.sets[0];
                const reps = setDef?.duration ?? `${setDef?.reps ?? '—'}`;
                return (
                  <View key={exercise.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 2.5,
                        backgroundColor: MUSCLE_COLOR[exercise.muscle] ?? '#8B5CF6',
                      }}
                    />
                    <AppText className="text-sm text-text-main flex-1" numberOfLines={1}>
                      {exercise.name}
                    </AppText>
                    <AppText className="text-xs text-text-muted">
                      {exercise.sets.length}×{reps}
                    </AppText>
                  </View>
                );
              })}
              {extraCount > 0 && (
                <AppText className="text-xs text-text-muted mt-1">
                  +{extraCount} exercícios
                </AppText>
              )}
            </View>
          </View>

          {/* ── Bottom row: muscle dots + play ── */}
          <View
            style={{
              backgroundColor: isDark ? '#111111' : '#F7F7F7',
              paddingHorizontal: 20,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', gap: 12, flexShrink: 1, flexWrap: 'wrap' }}>
              {todayMuscles.map((m) => (
                <View key={m} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View
                    style={{ height: 7, width: 7, borderRadius: 3.5, backgroundColor: MUSCLE_COLOR[m] ?? '#8B5CF6' }}
                  />
                  <AppText className="text-xs text-text-muted">{m}</AppText>
                </View>
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              className="w-14 h-14 rounded-full bg-brand-primary items-center justify-center shadow-lg shadow-brand-primary/40"
              style={{ marginLeft: 12 }}
              onPress={() =>
                router.push(`/(app)/workouts/${primarySheet.id}/session?sessionId=${todaySession.id}` as Href)
              }
            >
              <Play size={24} color="#FFFFFF" weight="fill" style={{ marginLeft: 3 }} />
            </Pressable>
          </View>
        </Pressable>
      </Animated.View>

      {/* ─── MAIS TREINOS ───────────────────────── */}
      {alternateSessions.length > 0 && (
        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <View className="flex-row items-end justify-between border-b border-border-subtle pb-4 mb-4">
            <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">
              Mais Treinos
            </AppText>
            <AppText className="text-xs text-text-muted">{alternateSessions.length} disponíveis</AppText>
          </View>

          <View style={{ gap: 10 }}>
            {alternateSessions.map(({ sheet, session }) => {
              const sessionMuscles = [...new Set(session.exercises.map((e) => e.muscle))].slice(0, 2);
              const exercisePreview = session.exercises.slice(0, 2).map((e) => e.name).join(', ');
              return (
                <Pressable
                  key={`${sheet.id}-${session.id}`}
                  accessibilityRole="button"
                  style={{
                    borderRadius: 20,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: dividerColor,
                  }}
                  onPress={() =>
                    router.push(`/(app)/workouts/${sheet.id}/session?sessionId=${session.id}` as Href)
                  }
                >
                  <View
                    style={{
                      backgroundColor: isDark ? '#111111' : '#F7F7F7',
                      padding: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <AppText className="font-heading text-lg font-bold text-text-main mb-0.5">
                        {session.title}
                      </AppText>
                      <AppText className="text-xs text-text-muted mb-2" numberOfLines={1}>
                        {exercisePreview}
                        {session.exercises.length > 2 ? `… +${session.exercises.length - 2}` : ''}
                      </AppText>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <AppText className="text-xs text-text-muted">
                          {session.type} · {session.estimatedMinutes}min
                        </AppText>
                        {sessionMuscles.map((m) => (
                          <View key={m} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <View style={{ height: 6, width: 6, borderRadius: 3, backgroundColor: MUSCLE_COLOR[m] ?? '#8B5CF6' }} />
                            <AppText className="text-xs text-text-muted">{m}</AppText>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Muted play */}
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: isDark ? '#1E1E1E' : '#E8E8E8',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Play size={18} color={isDark ? '#4A4A4A' : '#B8B8B8'} weight="fill" style={{ marginLeft: 2 }} />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      )}
    </AppShell>
  );
}
