import { ArrowLeft, Barbell, CheckCircle, LinkSimple, Pause, Play, PlayCircle, PersonSimpleRun, PersonSimpleTaiChi, X } from 'phosphor-react-native';
import { router, type Href, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Linking, Modal, Platform,
  Pressable, ScrollView, TextInput, View,
  type ScrollView as ScrollViewType,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { AppText } from '@/src/shared/components/ui/AppText';
import { useAppTheme } from '@/src/shared/theme/appTheme';
import { cn } from '@/src/shared/utils/cn';

import { WorkoutExerciseListItem } from '../components/WorkoutExerciseListItem';
import { getTotalSets, getWorkoutSession } from '../data/workoutSheets';

type SetEditorState = { exerciseIndex: number; setIndex: number };

function formatSeconds(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function weightKey(eId: string, sId: string) { return `${eId}:${sId}`; }
function repsKey(eId: string, sId: string) { return `${eId}:${sId}`; }

function parseWeight(value?: string) {
  const match = value?.replace(',', '.').match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function formatWeight(value: string) {
  const clean = value.trim().replace(',', '.');
  if (!clean) return '0kg';
  return /[a-zA-Z]/.test(clean) ? clean : `${clean}kg`;
}

const MUSCLE_COLOR: Record<string, string> = {
  Abdomen: '#8B5CF6', Core: '#8B5CF6',
  Quadriceps: '#F59E0B', Pernas: '#F59E0B',
  Dorsais: '#38BDF8', Biceps: '#A78BFA',
  Triceps: '#C084FC', Peitoral: '#FF6B9A',
  Posterior: '#FFB86B', Ombros: '#7DD3FC',
  Gluteos: '#FB7185', Panturrilhas: '#FCD34D',
};

function getMuscleIcon(muscle: string) {
  if (muscle === 'Core' || muscle === 'Abdomen') return PersonSimpleTaiChi;
  if (muscle === 'Pernas' || muscle === 'Quadriceps') return PersonSimpleRun;
  return Barbell;
}

export function WorkoutSessionScreen() {
  const { id, sessionId, exerciseId } = useLocalSearchParams<{
    id: string; sessionId?: string; exerciseId?: string;
  }>();
  const { isDark } = useAppTheme();
  const session = getWorkoutSession(id, sessionId);
  const sessionExercises = session.exercises.filter(Boolean);
  const initialIndex = Math.max(0, sessionExercises.findIndex((e) => e.id === exerciseId));
  const scrollRef = useRef<ScrollViewType>(null);
  const intervalYRef = useRef(0);
  const seriesYRef = useRef(0);

  const [viewMode, setViewMode] = useState<'workout' | 'exercise'>(exerciseId ? 'exercise' : 'workout');
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [completedByExercise, setCompletedByExercise] = useState<Record<string, number>>({});
  const [elapsed, setElapsed] = useState(0);
  const [restLeft, setRestLeft] = useState(0);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [workoutFinished, setWorkoutFinished] = useState(false);
  const [paused, setPaused] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [weightOverrides, setWeightOverrides] = useState<Record<string, string>>({});
  const [repsOverrides, setRepsOverrides] = useState<Record<string, string>>({});
  const [setEditor, setSetEditor] = useState<SetEditorState | null>(null);
  const [weightDraft, setWeightDraft] = useState('');
  const [repsDraft, setRepsDraft] = useState('');

  const exercise = sessionExercises[currentIndex] ?? sessionExercises[0];
  const exerciseVideos = exercise.videos ?? [];
  const embeddableVideo = exerciseVideos.find((v) => v.embedUrl && (v.provider === 'own' || v.provider === 'youtube'));
  const externalVideos = exerciseVideos.filter((v) => v.provider === 'reels' || v.provider === 'tiktok' || !v.embedUrl);
  const completedSets = completedByExercise[exercise.id] ?? 0;
  const restRunning = restLeft > 0;
  const totalSets = getTotalSets({ ...session, exercises: sessionExercises });
  const completedSetsTotal = sessionExercises.reduce((t, item) => t + (completedByExercise[item.id] ?? 0), 0);
  const completedExercisesTotal = sessionExercises.filter((item) => (completedByExercise[item.id] ?? 0) >= item.sets.length).length;
  const progressionsTotal = sessionExercises.reduce((t, item) => {
    const done = completedByExercise[item.id] ?? 0;
    return t + item.sets.filter((set, i) => {
      const override = weightOverrides[weightKey(item.id, set.id)];
      return i < done && override && parseWeight(override) > parseWeight(set.weight);
    }).length;
  }, 0);
  const exerciseDone = completedSets >= exercise.sets.length;
  const allWorkoutSetsDone = completedSetsTotal >= totalSets;
  const isLastExercise = currentIndex >= sessionExercises.length - 1;
  const timerRunning = workoutStarted && !workoutFinished && !paused;
  const progressPercent = completedSetsTotal === 0 ? 0 : Math.max(3, (completedSetsTotal / Math.max(1, totalSets)) * 100);
  const muscleAccent = MUSCLE_COLOR[exercise.muscle] ?? '#8B5CF6';
  const MuscleIcon = getMuscleIcon(exercise.muscle);

  useEffect(() => {
    if (!timerRunning) return undefined;
    const timer = setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => clearInterval(timer);
  }, [timerRunning]);

  useEffect(() => {
    if (!timerRunning || restLeft <= 0) return undefined;
    const timer = setInterval(() => setRestLeft((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(timer);
  }, [timerRunning, restLeft]);

  function startWorkout() { setWorkoutStarted(true); setWorkoutFinished(false); setPaused(false); }

  function startCurrentExercise() {
    const first = sessionExercises.findIndex((item) => (completedByExercise[item.id] ?? 0) < item.sets.length);
    startWorkout();
    setCurrentIndex(first >= 0 ? first : sessionExercises.length - 1);
    setViewMode('exercise');
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
  }

  function handlePrimaryAction() {
    if (!workoutStarted) { startWorkout(); return; }
    if (exerciseDone) { isLastExercise ? finishWorkout() : nextExercise(); return; }
    markSet();
  }

  function markSet() {
    const next = Math.min(exercise.sets.length, completedSets + 1);
    setCompletedByExercise((c) => ({ ...c, [exercise.id]: next }));
    setRestLeft(next < exercise.sets.length ? exercise.restSeconds : 0);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, intervalYRef.current - 24), animated: true });
    });
  }

  function nextExercise() {
    setCurrentIndex((v) => Math.min(sessionExercises.length - 1, v + 1));
    setRestLeft(0); setVideoOpen(false); setViewMode('exercise');
  }

  function openExercise(index: number) {
    setCurrentIndex(index); setRestLeft(0); setVideoOpen(false); setViewMode('exercise');
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
  }

  function getSetWeight(eId: string, sId: string, pw?: string) {
    return weightOverrides[weightKey(eId, sId)] ?? pw;
  }

  function getSetReps(eId: string, sId: string, pr: string) {
    return repsOverrides[repsKey(eId, sId)] ?? pr;
  }

  function openSetEditor(setIndex: number) {
    const set = exercise.sets[setIndex];
    if (!set) return;
    setRepsDraft(getSetReps(exercise.id, set.id, set.reps));
    setWeightDraft(set.weight ? parseWeight(getSetWeight(exercise.id, set.id, set.weight)).toString() : '');
    setSetEditor({ exerciseIndex: currentIndex, setIndex });
  }

  function applySetExecution(scope: 'single' | 'exercise-next' | 'workout-next') {
    if (!setEditor) return;
    const nw = weightDraft ? formatWeight(weightDraft) : '';
    const nr = repsDraft.trim();
    setWeightOverrides((cur) => {
      const next = { ...cur };
      sessionExercises.forEach((item, ii) => {
        if (scope === 'single' && ii !== setEditor.exerciseIndex) return;
        if (scope === 'exercise-next' && ii !== setEditor.exerciseIndex) return;
        if (scope === 'workout-next' && ii < setEditor.exerciseIndex) return;
        item.sets.forEach((set, si) => {
          if (!set.weight) return;
          if (scope === 'single' && si !== setEditor.setIndex) return;
          if ((scope === 'exercise-next' || scope === 'workout-next') && ii === setEditor.exerciseIndex && si < setEditor.setIndex) return;
          if (nw) next[weightKey(item.id, set.id)] = nw;
        });
      });
      return next;
    });
    setRepsOverrides((cur) => {
      const next = { ...cur };
      if (!nr) return next;
      sessionExercises.forEach((item, ii) => {
        if (scope === 'single' && ii !== setEditor.exerciseIndex) return;
        if (scope === 'exercise-next' && ii !== setEditor.exerciseIndex) return;
        if (scope === 'workout-next' && ii < setEditor.exerciseIndex) return;
        item.sets.forEach((set, si) => {
          if (scope === 'single' && si !== setEditor.setIndex) return;
          if ((scope === 'exercise-next' || scope === 'workout-next') && ii === setEditor.exerciseIndex && si < setEditor.setIndex) return;
          next[repsKey(item.id, set.id)] = nr;
        });
      });
      return next;
    });
    setSetEditor(null);
  }

  function finishWorkout() {
    setWorkoutFinished(true); setPaused(true); setRestLeft(0);
    router.push(
      `/(app)/workouts/${id}/finish?sessionId=${session.id}&elapsed=${elapsed}&sets=${completedSetsTotal}&totalSets=${totalSets}&exercises=${completedExercisesTotal}&progressions=${progressionsTotal}` as Href,
    );
  }

  function confirmCloseWorkout() {
    if (!workoutStarted && completedSetsTotal === 0) { router.back(); return; }
    Alert.alert('Encerrar treino?', 'Você pode salvar o progresso ou descartar.', [
      { text: 'Continuar', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => router.replace('/(app)/(tabs)/workouts') },
      { text: 'Salvar e sair', onPress: finishWorkout },
    ]);
  }

  function toggleTimer() {
    if (workoutFinished) return;
    if (!workoutStarted) { startWorkout(); return; }
    setPaused((v) => !v);
  }

  const primaryActionLabel = !workoutStarted
    ? 'Iniciar treino'
    : exerciseDone
      ? isLastExercise ? 'Finalizar treino' : 'Próximo exercício'
      : 'Marcar série';

  return (
    <View className="flex-1 bg-bg-base">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ScrollView
          ref={scrollRef}
          alwaysBounceVertical={false}
          bounces
          contentContainerClassName="pb-48 pt-8"
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        >
          {/* Header — sempre com px-6 */}
          <View className="mb-8 px-6 flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center rounded-full bg-bg-surface border border-border-subtle"
              onPress={() => viewMode === 'exercise' ? setViewMode('workout') : router.back()}
            >
              <ArrowLeft color={isDark ? '#FFFFFF' : '#111827'} size={20} weight="bold" />
            </Pressable>
            <View className="flex-1 items-center px-4">
              <AppText className="text-[11px] font-bold uppercase tracking-[0.25em] text-text-muted">
                {viewMode === 'exercise'
                  ? `${currentIndex + 1} de ${sessionExercises.length}`
                  : session.title}
              </AppText>
              {workoutStarted && (
                <View className="mt-2 h-[2px] w-20 rounded-full bg-bg-surface overflow-hidden">
                  <View
                    className="h-full rounded-full bg-brand-primary"
                    style={{ width: `${progressPercent}%` }}
                  />
                </View>
              )}
            </View>
            <View className="w-11" />
          </View>

          {viewMode === 'workout' ? (
            /* ─── OVERVIEW ─────────────────────────── */
            <View className="px-6">
              <Animated.View entering={FadeInDown.springify().damping(22).stiffness(180)}>
                <AppText className="text-[11px] font-bold uppercase tracking-[0.25em] text-text-muted mb-3">
                  {workoutFinished
                    ? 'Finalizado'
                    : allWorkoutSetsDone
                      ? 'Pronto para finalizar'
                      : workoutStarted
                        ? 'Em andamento'
                        : 'Pronto para iniciar'}
                </AppText>
                <AppText className="font-heading text-3xl font-bold text-text-main mb-2">
                  {session.title}
                </AppText>
                <AppText className="text-sm text-text-muted mb-8">
                  {session.type} · {session.estimatedMinutes}min · {session.days}
                </AppText>

                {/* Stats em linha */}
                <View className="flex-row items-center gap-6 mb-8">
                  <View className="flex-row items-baseline gap-1.5">
                    <AppText className="font-heading text-2xl font-bold text-text-main">{formatSeconds(elapsed)}</AppText>
                    <AppText className="text-[10px] text-text-muted uppercase tracking-wide">tempo</AppText>
                  </View>
                  <View className="h-4 w-px bg-border-subtle" />
                  <View className="flex-row items-baseline gap-1.5">
                    <AppText className="font-heading text-2xl font-bold text-text-main">{completedSetsTotal}/{totalSets}</AppText>
                    <AppText className="text-[10px] text-text-muted uppercase tracking-wide">séries</AppText>
                  </View>
                  <View className="h-4 w-px bg-border-subtle" />
                  <View className="flex-row items-baseline gap-1.5">
                    <AppText className="font-heading text-2xl font-bold text-text-main">
                      {completedExercisesTotal}/{sessionExercises.length}
                    </AppText>
                    <AppText className="text-[10px] text-text-muted uppercase tracking-wide">feitos</AppText>
                  </View>
                </View>

                {!workoutFinished && (
                  <Pressable
                    accessibilityRole="button"
                    className="min-h-[58px] flex-row items-center justify-center gap-2.5 rounded-2xl bg-brand-primary"
                    onPress={allWorkoutSetsDone ? finishWorkout : startCurrentExercise}
                  >
                    {allWorkoutSetsDone
                      ? <CheckCircle color="#FFFFFF" size={18} weight="bold" />
                      : <Play color="#FFFFFF" size={18} weight="fill" />}
                    <AppText className="text-base font-bold text-white">
                      {allWorkoutSetsDone ? 'Finalizar treino' : workoutStarted ? 'Continuar' : 'Iniciar treino'}
                    </AppText>
                  </Pressable>
                )}
              </Animated.View>

              {/* Lista de exercícios */}
              <Animated.View
                entering={FadeInDown.springify().damping(22).stiffness(180).delay(80)}
                className="mt-12"
                onLayout={(e) => { seriesYRef.current = e.nativeEvent.layout.y; }}
              >
                <View className="border-b border-border-subtle pb-3 mb-1 flex-row items-center justify-between">
                  <AppText className="text-[11px] font-bold uppercase tracking-[0.25em] text-text-muted">
                    Exercícios
                  </AppText>
                  {restRunning && (
                    <AppText className="text-xs text-brand-secondary font-bold">
                      {formatSeconds(restLeft)} descanso
                    </AppText>
                  )}
                </View>
                {sessionExercises.map((item, index) => (
                  <WorkoutExerciseListItem
                    key={item.id}
                    exercise={item}
                    completedSets={completedByExercise[item.id] ?? 0}
                    isDark={isDark}
                    onPress={() => openExercise(index)}
                  />
                ))}
              </Animated.View>
            </View>
          ) : (
            /* ─── EXERCISE DETAIL ───────────────────── */
            <>
              {/* Full-bleed banner com cor do grupo muscular */}
              <View
                style={{
                  backgroundColor: `${muscleAccent}12`,
                  paddingTop: 24,
                  paddingBottom: 24,
                  marginBottom: 24,
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: `${muscleAccent}20`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MuscleIcon color={muscleAccent} size={72} weight="duotone" />
                </View>
              </View>

              {/* Conteúdo do exercício */}
              <View className="px-6">
                <Animated.View entering={FadeInDown.springify().damping(22).stiffness(180)}>
                  {/* Muscle + equipment */}
                  <View className="flex-row items-center gap-2 mb-3">
                    <View
                      className="px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: `${muscleAccent}20` }}
                    >
                      <AppText className="text-[11px] font-bold uppercase tracking-wide" style={{ color: muscleAccent }}>
                        {exercise.muscle}
                      </AppText>
                    </View>
                    <AppText className="text-xs text-text-muted">{exercise.equipment}</AppText>
                  </View>

                  {/* Nome do exercício */}
                  <AppText className="font-heading text-2xl font-bold text-text-main mb-5">
                    {exercise.name}
                  </AppText>

                  {/* Instruções — sempre visíveis */}
                  {(exercise.description ?? exercise.cue) ? (
                    <AppText className="text-sm leading-relaxed text-text-muted mb-4">
                      {exercise.description ?? exercise.cue}
                    </AppText>
                  ) : null}

                  {(exercise.executionTips ?? []).length > 0 && (
                    <View className="gap-2.5 mb-5">
                      {(exercise.executionTips ?? []).map((tip) => (
                        <View key={tip} className="flex-row gap-3">
                          <View
                            className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: muscleAccent }}
                          />
                          <AppText className="flex-1 text-sm leading-relaxed text-text-muted">{tip}</AppText>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Botão de vídeo */}
                  {embeddableVideo?.embedUrl ? (
                    <Pressable
                      className="flex-row items-center gap-2 mb-5 py-3 px-4 rounded-xl bg-bg-surface border border-border-subtle"
                      onPress={() => setVideoOpen((v) => !v)}
                    >
                      <PlayCircle color="#A78BFA" size={17} weight="duotone" />
                      <AppText className="text-sm font-bold text-brand-secondary">
                        {videoOpen ? 'Fechar vídeo' : 'Ver demonstração'}
                      </AppText>
                    </Pressable>
                  ) : null}

                  {videoOpen && embeddableVideo?.embedUrl ? (
                    <Animated.View
                      entering={FadeInDown.springify().damping(22).stiffness(180)}
                      className="h-48 overflow-hidden rounded-2xl bg-black mb-5"
                    >
                      <WebView
                        allowsFullscreenVideo
                        javaScriptEnabled
                        mediaPlaybackRequiresUserAction={false}
                        source={{ uri: embeddableVideo.embedUrl }}
                      />
                    </Animated.View>
                  ) : null}

                  {externalVideos.length > 0 && (
                    <View className="mb-5">
                      {externalVideos.map((video) => (
                        <Pressable
                          key={video.id}
                          accessibilityRole="button"
                          className="flex-row items-center justify-between py-3"
                          style={{ borderBottomWidth: 1, borderBottomColor: isDark ? '#1A1A1A' : '#F0F0F0' }}
                          onPress={() => Linking.openURL(video.url)}
                        >
                          <AppText className="text-sm font-semibold text-text-main">{video.title}</AppText>
                          <LinkSimple color="#A78BFA" size={15} weight="bold" />
                        </Pressable>
                      ))}
                    </View>
                  )}
                </Animated.View>

                {/* ─── SÉRIES ──────────────────────────── */}
                <Animated.View
                  entering={FadeInDown.springify().damping(22).stiffness(180).delay(60)}
                  onLayout={(e) => { seriesYRef.current = e.nativeEvent.layout.y; }}
                >
                  <View className="flex-row items-center justify-between border-b border-border-subtle pb-3 mb-1">
                    <AppText className="text-[11px] font-bold uppercase tracking-[0.25em] text-text-muted">
                      Séries
                    </AppText>
                    {exercise.previous ? (
                      <AppText className="text-xs text-text-muted">Anterior: {exercise.previous}</AppText>
                    ) : null}
                  </View>

                  <View onLayout={(e) => { seriesYRef.current = e.nativeEvent.layout.y; }}>
                    {exercise.sets.map((set, index) => {
                      const done = index < completedSets;
                      const isNext = index === completedSets && !exerciseDone;
                      const curReps = getSetReps(exercise.id, set.id, set.reps);
                      const curWeight = getSetWeight(exercise.id, set.id, set.weight);

                      return (
                        <Pressable
                          key={set.id}
                          className={cn(
                            'flex-row items-center py-3.5',
                            isNext ? 'px-3 -mx-3 rounded-xl' : undefined,
                          )}
                          style={[
                            !isNext
                              ? { borderBottomWidth: 1, borderBottomColor: isDark ? '#1A1A1A' : '#F0F0F0' }
                              : { backgroundColor: `${muscleAccent}09`, marginBottom: 1 },
                            done ? { opacity: 0.35 } : undefined,
                          ]}
                          onPress={() => openSetEditor(index)}
                        >
                          {/* Número */}
                          <AppText
                            className={cn(
                              'w-8 text-sm font-bold',
                              isNext ? 'text-brand-secondary' : 'text-text-muted',
                            )}
                          >
                            {index + 1}
                          </AppText>

                          {/* Reps */}
                          <AppText
                            className={cn(
                              'flex-1 text-base font-bold',
                              done ? 'line-through text-text-muted' : 'text-text-main',
                            )}
                          >
                            {curReps} reps
                          </AppText>

                          {/* Peso + badge */}
                          <View className="flex-row items-center gap-2">
                            <AppText
                              className={cn(
                                'text-base font-semibold',
                                done ? 'text-text-muted' : 'text-text-main',
                              )}
                            >
                              {curWeight ?? set.duration ?? '—'}
                            </AppText>
                            {isNext && (
                              <View
                                className="rounded-full px-2 py-0.5"
                                style={{ backgroundColor: `${muscleAccent}20` }}
                              >
                                <AppText
                                  className="text-[9px] font-bold uppercase tracking-wide"
                                  style={{ color: muscleAccent }}
                                >
                                  agora
                                </AppText>
                              </View>
                            )}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Descanso */}
                  <View
                    className="mt-5 flex-row items-center justify-between py-5"
                    onLayout={(e) => { intervalYRef.current = seriesYRef.current + e.nativeEvent.layout.y; }}
                  >
                    <View>
                      <AppText className="text-[11px] font-bold uppercase tracking-[0.25em] text-text-muted mb-1">
                        Descanso
                      </AppText>
                      <AppText
                        className={cn(
                          'font-heading text-2xl font-bold',
                          restRunning ? 'text-brand-secondary' : 'text-text-main',
                        )}
                      >
                        {restRunning ? formatSeconds(restLeft) : formatSeconds(exercise.restSeconds)}
                      </AppText>
                    </View>
                    <Pressable
                      className={cn(
                        'h-12 px-6 items-center justify-center rounded-full',
                        restRunning ? 'bg-red-500/12' : 'bg-brand-primary/10',
                      )}
                      onPress={() => {
                        if (!workoutStarted) startWorkout();
                        setRestLeft(restRunning ? 0 : exercise.restSeconds);
                      }}
                    >
                      <AppText
                        className={cn(
                          'text-sm font-bold',
                          restRunning ? 'text-red-400' : 'text-brand-secondary',
                        )}
                      >
                        {restRunning ? 'Parar' : 'Iniciar'}
                      </AppText>
                    </Pressable>
                  </View>
                </Animated.View>
              </View>
            </>
          )}
        </ScrollView>

        {/* ─── BOTTOM BAR ─────────────────────────── */}
        <View
          className="absolute bottom-0 left-0 right-0 px-6 pt-3 pb-8"
          style={{
            backgroundColor: isDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.97)',
            borderTopWidth: 1,
            borderTopColor: isDark ? '#1A1A1A' : '#F0F0F0',
          }}
        >
          {viewMode === 'exercise' && !workoutFinished && (
            <Pressable
              className="mb-3 min-h-[52px] items-center justify-center rounded-2xl bg-brand-primary"
              onPress={handlePrimaryAction}
            >
              <AppText className="text-base font-bold text-white">{primaryActionLabel}</AppText>
            </Pressable>
          )}

          <View className="flex-row items-center justify-between">
            <Pressable
              className="h-11 w-11 items-center justify-center rounded-full bg-red-500/12"
              onPress={confirmCloseWorkout}
            >
              <X color={isDark ? '#FF6B6B' : '#EF4444'} size={18} weight="bold" />
            </Pressable>

            <Pressable className="items-center px-4" onPress={toggleTimer}>
              <AppText className="font-heading text-2xl font-bold text-text-main">
                {formatSeconds(elapsed)}
              </AppText>
              <AppText className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                {workoutFinished
                  ? 'finalizado'
                  : !workoutStarted
                    ? 'toque para iniciar'
                    : paused
                      ? 'pausado'
                      : 'rodando'}
              </AppText>
            </Pressable>

            <Pressable
              className="h-11 w-11 items-center justify-center rounded-full bg-bg-surface border border-border-subtle"
              onPress={toggleTimer}
            >
              {!workoutStarted || paused
                ? <Play color={isDark ? '#FFFFFF' : '#111827'} size={17} weight="fill" />
                : <Pause color={isDark ? '#FFFFFF' : '#111827'} size={17} weight="fill" />}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {/* ─── MODAL EDIÇÃO DE SÉRIE ──────────────── */}
      <Modal
        animationType="fade"
        transparent
        visible={Boolean(setEditor)}
        onRequestClose={() => setSetEditor(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 18 : 0}
        >
          <Pressable className="flex-1" onPress={() => setSetEditor(null)} />

          {/* Outer bezel/shell */}
          <View
            className="mx-4 mb-4"
            style={{
              borderRadius: 32,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
              padding: 3,
            }}
          >
            {/* Inner panel */}
            <View
              className="px-6 py-6"
              style={{
                borderRadius: 28,
                backgroundColor: isDark ? '#111111' : '#FFFFFF',
              }}
            >
              <AppText className="text-[11px] font-bold uppercase tracking-[0.25em] text-text-muted mb-1">
                Editar série
              </AppText>
              <AppText className="font-heading text-2xl font-bold text-text-main mb-6 tracking-tight">
                Ajustar execução
              </AppText>

              <View className="flex-row gap-4 mb-6">
                <View className="flex-1">
                  <AppText className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-2">
                    Reps
                  </AppText>
                  <TextInput
                    autoFocus
                    className="h-14 rounded-xl bg-bg-base px-4 text-2xl font-bold text-text-main"
                    style={{ borderWidth: 1, borderColor: isDark ? '#2A2A2A' : '#E5E7EB' }}
                    keyboardType="number-pad"
                    onChangeText={setRepsDraft}
                    placeholder="0"
                    placeholderTextColor={isDark ? '#444' : '#9CA3AF'}
                    value={repsDraft}
                  />
                </View>
                <View className="flex-1">
                  <AppText className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-2">
                    Peso (kg)
                  </AppText>
                  <TextInput
                    className="h-14 rounded-xl bg-bg-base px-4 text-2xl font-bold text-text-main"
                    style={{ borderWidth: 1, borderColor: isDark ? '#2A2A2A' : '#E5E7EB' }}
                    keyboardType="decimal-pad"
                    onChangeText={setWeightDraft}
                    placeholder="—"
                    placeholderTextColor={isDark ? '#444' : '#9CA3AF'}
                    value={weightDraft}
                  />
                </View>
              </View>

              <View className="gap-2.5">
                <Pressable
                  className="min-h-[50px] items-center justify-center rounded-2xl bg-brand-primary"
                  onPress={() => applySetExecution('single')}
                >
                  <AppText className="text-sm font-bold text-white">Só esta série</AppText>
                </Pressable>
                <Pressable
                  className="min-h-[50px] items-center justify-center rounded-2xl"
                  style={{ borderWidth: 1, borderColor: isDark ? '#2A2A2A' : '#E5E7EB' }}
                  onPress={() => applySetExecution('exercise-next')}
                >
                  <AppText className="text-sm font-bold text-text-main">Esta e próximas séries</AppText>
                </Pressable>
                <Pressable
                  className="min-h-[50px] items-center justify-center rounded-2xl"
                  style={{ borderWidth: 1, borderColor: isDark ? '#2A2A2A' : '#E5E7EB' }}
                  onPress={() => applySetExecution('workout-next')}
                >
                  <AppText className="text-sm font-bold text-text-main">Todos os próximos</AppText>
                </Pressable>
                <Pressable
                  className="min-h-[44px] items-center justify-center"
                  onPress={() => setSetEditor(null)}
                >
                  <AppText className="text-sm font-semibold text-text-muted">Cancelar</AppText>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
