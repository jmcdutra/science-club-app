import { ArrowDown, ArrowLeft, ArrowUp, Barbell, CheckCircle, ClockCountdown, Info, LinkSimple, Pause, PencilSimple, Play, PlayCircle, TrendUp, X } from 'phosphor-react-native';
import { router, type Href, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, TextInput, View, type ScrollView as ScrollViewType } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { AppText } from '@/src/shared/components/ui/AppText';
import { cn } from '@/src/shared/utils/cn';

import { ExerciseVisual } from '../components/ExerciseVisual';
import { WorkoutExerciseListItem } from '../components/WorkoutExerciseListItem';
import { getTotalSets, getWorkoutSession } from '../data/workoutSheets';

type WeightEditorState = {
  exerciseIndex: number;
  setIndex: number;
};

function formatSeconds(total: number) {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function weightKey(exerciseId: string, setId: string) {
  return `${exerciseId}:${setId}`;
}

function parseWeight(value?: string) {
  const match = value?.replace(',', '.').match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function formatWeight(value: string) {
  const cleanValue = value.trim().replace(',', '.');
  if (!cleanValue) {
    return '0kg';
  }

  return /[a-zA-Z]/.test(cleanValue) ? cleanValue : `${cleanValue}kg`;
}

export function WorkoutSessionScreen() {
  const { id, sessionId, exerciseId } = useLocalSearchParams<{ id: string; sessionId?: string; exerciseId?: string }>();
  const session = getWorkoutSession(id, sessionId);
  const sessionExercises = session.exercises.filter(Boolean);
  const initialIndex = Math.max(0, sessionExercises.findIndex((exercise) => exercise.id === exerciseId));
  const scrollRef = useRef<ScrollViewType>(null);
  const seriesYRef = useRef(0);
  const intervalYRef = useRef(0);
  const [viewMode, setViewMode] = useState<'workout' | 'exercise'>(exerciseId ? 'exercise' : 'workout');
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [completedByExercise, setCompletedByExercise] = useState<Record<string, number>>({});
  const [elapsed, setElapsed] = useState(0);
  const [restLeft, setRestLeft] = useState(0);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [workoutFinished, setWorkoutFinished] = useState(false);
  const [paused, setPaused] = useState(false);
  const [noteMode, setNoteMode] = useState(false);
  const [customWeight, setCustomWeight] = useState('0');
  const [infoOpen, setInfoOpen] = useState(false);
  const [weightOverrides, setWeightOverrides] = useState<Record<string, string>>({});
  const [weightEditor, setWeightEditor] = useState<WeightEditorState | null>(null);
  const [weightDraft, setWeightDraft] = useState('');

  const exercise = sessionExercises[currentIndex] ?? sessionExercises[0];
  const exerciseVideos = exercise.videos ?? [];
  const embeddableVideo = exerciseVideos.find((video) => video.embedUrl && (video.provider === 'own' || video.provider === 'youtube'));
  const externalVideos = exerciseVideos.filter((video) => video.provider === 'reels' || video.provider === 'tiktok' || !video.embedUrl);
  const completedSets = completedByExercise[exercise.id] ?? 0;
  const restRunning = restLeft > 0;
  const totalSets = getTotalSets({ ...session, exercises: sessionExercises });
  const completedSetsTotal = sessionExercises.reduce((total, item) => total + (completedByExercise[item.id] ?? 0), 0);
  const completedExercisesTotal = sessionExercises.filter((item) => (completedByExercise[item.id] ?? 0) >= item.sets.length).length;
  const progressionsTotal = sessionExercises.reduce((total, item) => {
    const completedCount = completedByExercise[item.id] ?? 0;
    const progressedSets = item.sets.filter((set, index) => {
      const override = weightOverrides[weightKey(item.id, set.id)];
      return index < completedCount && override && parseWeight(override) > parseWeight(set.weight);
    });

    return total + progressedSets.length;
  }, 0);
  const exerciseDone = completedSets >= exercise.sets.length;
  const allWorkoutSetsDone = completedSetsTotal >= totalSets;
  const isLastExercise = currentIndex >= sessionExercises.length - 1;
  const timerRunning = workoutStarted && !workoutFinished && !paused;

  useEffect(() => {
    if (!timerRunning) {
      return undefined;
    }

    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [timerRunning]);

  useEffect(() => {
    if (!timerRunning || restLeft <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setRestLeft((value) => Math.max(0, value - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timerRunning, restLeft]);

  function startWorkout() {
    setWorkoutStarted(true);
    setWorkoutFinished(false);
    setPaused(false);
  }

  function startCurrentExercise() {
    const firstIncompleteIndex = sessionExercises.findIndex((item) => (completedByExercise[item.id] ?? 0) < item.sets.length);

    startWorkout();
    setCurrentIndex(firstIncompleteIndex >= 0 ? firstIncompleteIndex : sessionExercises.length - 1);
    setViewMode('exercise');
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
  }

  function handlePrimaryAction() {
    if (!workoutStarted) {
      startWorkout();
      return;
    }

    if (exerciseDone) {
      if (isLastExercise) {
        finishWorkout();
        return;
      }

      nextExercise();
      return;
    }

    markSet();
  }

  function markSet() {
    const nextValue = Math.min(exercise.sets.length, completedSets + 1);
    setCompletedByExercise((current) => ({ ...current, [exercise.id]: nextValue }));

    if (nextValue < exercise.sets.length) {
      setRestLeft(exercise.restSeconds);
    } else {
      setRestLeft(0);
    }
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, intervalYRef.current - 24), animated: true });
    });
  }

  function nextExercise() {
    setCurrentIndex((value) => Math.min(sessionExercises.length - 1, value + 1));
    setRestLeft(0);
    setNoteMode(false);
    setInfoOpen(false);
    setViewMode('exercise');
  }

  function previousExercise() {
    setCurrentIndex((value) => Math.max(0, value - 1));
    setRestLeft(0);
    setNoteMode(false);
    setInfoOpen(false);
    setViewMode('exercise');
  }

  function openExercise(index: number) {
    setCurrentIndex(index);
    setRestLeft(0);
    setNoteMode(false);
    setInfoOpen(false);
    setViewMode('exercise');
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
  }

  function getSetWeight(exerciseId: string, setId: string, prescribedWeight?: string) {
    return weightOverrides[weightKey(exerciseId, setId)] ?? prescribedWeight;
  }

  function openWeightEditor(setIndex: number) {
    const set = exercise.sets[setIndex];

    if (!set?.weight) {
      return;
    }

    setWeightDraft(parseWeight(getSetWeight(exercise.id, set.id, set.weight)).toString());
    setWeightEditor({ exerciseIndex: currentIndex, setIndex });
  }

  function applyWeight(scope: 'single' | 'exercise-next' | 'workout-next') {
    if (!weightEditor) {
      return;
    }

    const nextWeight = formatWeight(weightDraft);
    setWeightOverrides((current) => {
      const next = { ...current };

      sessionExercises.forEach((item, itemIndex) => {
        if (scope === 'single' && itemIndex !== weightEditor.exerciseIndex) {
          return;
        }

        if (scope === 'exercise-next' && itemIndex !== weightEditor.exerciseIndex) {
          return;
        }

        if (scope === 'workout-next' && itemIndex < weightEditor.exerciseIndex) {
          return;
        }

        item.sets.forEach((set, setIndex) => {
          if (!set.weight) {
            return;
          }

          if (scope === 'single' && setIndex !== weightEditor.setIndex) {
            return;
          }

          if ((scope === 'exercise-next' || scope === 'workout-next') && itemIndex === weightEditor.exerciseIndex && setIndex < weightEditor.setIndex) {
            return;
          }

          next[weightKey(item.id, set.id)] = nextWeight;
        });
      });

      return next;
    });
    setWeightEditor(null);
  }

  function openVideo(url: string) {
    Linking.openURL(url);
  }

  function finishWorkout() {
    setWorkoutFinished(true);
    setPaused(true);
    setRestLeft(0);
    router.push(
      `/(app)/workouts/${id}/finish?sessionId=${session.id}&elapsed=${elapsed}&sets=${completedSetsTotal}&totalSets=${totalSets}&exercises=${completedExercisesTotal}&progressions=${progressionsTotal}` as Href,
    );
  }

  function confirmCloseWorkout() {
    if (!workoutStarted && completedSetsTotal === 0) {
      router.back();
      return;
    }

    Alert.alert('Encerrar treino?', 'Voce pode salvar o que ja foi feito, descartar este treino ou continuar treinando.', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => router.replace('/(app)/(tabs)/workouts'),
      },
      {
        text: 'Encerrar',
        onPress: finishWorkout,
      },
    ]);
  }

  function toggleTimer() {
    if (workoutFinished) {
      return;
    }

    if (!workoutStarted) {
      startWorkout();
      return;
    }

    setPaused((value) => !value);
  }

  const primaryActionLabel = !workoutStarted
    ? 'Iniciar treino'
    : exerciseDone
      ? isLastExercise
        ? 'Finalizar treino'
        : 'Proximo exercicio'
      : 'Marcar serie';

  return (
    <View className="flex-1 bg-bg-base">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ScrollView
          ref={scrollRef}
          alwaysBounceVertical={false}
          bounces
          contentContainerClassName="px-5 pb-56 pt-8"
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-8 flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              className="h-14 w-14 items-center justify-center rounded-full border border-border-subtle bg-bg-surface"
              onPress={() => (viewMode === 'exercise' ? setViewMode('workout') : router.back())}
            >
              <ArrowLeft color="#FFFFFF" size={26} weight="bold" />
            </Pressable>
            <View className="flex-1 px-4">
              <AppText className="text-center text-xl font-semibold text-text-main">
                {viewMode === 'exercise' ? `${currentIndex + 1} de ${sessionExercises.length}` : session.title}
              </AppText>
              <AppText className="mt-1 text-center text-xs text-text-muted">
                {completedSetsTotal}/{totalSets} series anotadas
              </AppText>
            </View>
            <View className="h-14 flex-row items-center overflow-hidden rounded-full border border-border-subtle bg-bg-surface">
              <Pressable className="h-full w-12 items-center justify-center" onPress={() => viewMode === 'exercise' && previousExercise()}>
                <ArrowUp color={viewMode !== 'exercise' || currentIndex === 0 ? '#454955' : '#A78BFA'} size={21} weight="bold" />
              </Pressable>
              <Pressable className="h-full w-12 items-center justify-center" onPress={() => viewMode === 'exercise' && nextExercise()}>
                <ArrowDown color={viewMode !== 'exercise' || currentIndex === sessionExercises.length - 1 ? '#454955' : '#A78BFA'} size={21} weight="bold" />
              </Pressable>
            </View>
          </View>

          {viewMode === 'workout' ? (
            <>
              <Animated.View entering={FadeInDown.duration(420)}>
                <View className="mb-6 rounded-[32px] border border-border-subtle bg-bg-surface px-5 py-5">
                  <View className="mb-5 flex-row items-start justify-between gap-4">
                    <View className="flex-1">
                      <AppText className="text-sm text-text-muted">
                        {workoutFinished ? 'Treino finalizado' : allWorkoutSetsDone ? 'Pronto para finalizar' : workoutStarted ? 'Treino em andamento' : 'Pronto para iniciar'}
                      </AppText>
                      <AppText className="mt-2 text-4xl font-semibold leading-tight text-text-main">{session.title}</AppText>
                      <AppText className="mt-3 text-base leading-snug text-text-muted">
                        {session.type} - {session.estimatedMinutes} min - {session.days}
                      </AppText>
                    </View>
                    <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/15">
                      <Barbell color="#A78BFA" size={26} weight="duotone" />
                    </View>
                  </View>

                  <View className="mb-5 h-2 overflow-hidden rounded-full bg-bg-base">
                    <View
                      className="h-full rounded-full bg-brand-primary"
                      style={{ width: completedSetsTotal === 0 ? '0%' : `${Math.max(5, (completedSetsTotal / Math.max(1, totalSets)) * 100)}%` }}
                    />
                  </View>

                  <View className="flex-row gap-3">
                    {[
                      { label: 'Tempo', value: formatSeconds(elapsed) },
                      { label: 'Series', value: `${completedSetsTotal}/${totalSets}` },
                      { label: 'Exercicios', value: `${sessionExercises.filter((item) => (completedByExercise[item.id] ?? 0) >= item.sets.length).length}/${sessionExercises.length}` },
                    ].map((item) => (
                      <View key={item.label} className="flex-1 rounded-2xl border border-border-subtle bg-bg-base px-3 py-3">
                        <AppText className="text-xs text-text-muted">{item.label}</AppText>
                        <AppText className="mt-1 text-base font-semibold text-text-main">{item.value}</AppText>
                      </View>
                    ))}
                  </View>

                  {!workoutFinished ? (
                    <Pressable
                      accessibilityRole="button"
                      className="mt-5 min-h-[58px] flex-row items-center justify-center gap-2 rounded-2xl bg-brand-primary px-5"
                      onPress={allWorkoutSetsDone ? finishWorkout : startCurrentExercise}
                    >
                      {allWorkoutSetsDone ? <CheckCircle color="#FFFFFF" size={18} weight="bold" /> : <Play color="#FFFFFF" size={18} weight="fill" />}
                      <AppText className="text-base font-semibold text-white">
                        {allWorkoutSetsDone ? 'Finalizar treino' : workoutStarted ? 'Continuar exercicio atual' : 'Iniciar treino'}
                      </AppText>
                    </Pressable>
                  ) : (
                    <View className="mt-5 rounded-2xl border border-brand-primary/30 bg-brand-primary/10 px-4 py-4">
                      <AppText className="text-base font-semibold text-brand-secondary">Abrindo resumo do treino</AppText>
                      <AppText className="mt-1 text-sm leading-snug text-text-muted">
                        Vamos registrar sua foto, comentario e compartilhamento na proxima tela.
                      </AppText>
                    </View>
                  )}
                </View>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(80).duration(420)}
                onLayout={(event) => {
                  seriesYRef.current = event.nativeEvent.layout.y;
                }}
              >
                <View className="mb-4 flex-row items-center justify-between">
                  <AppText className="text-3xl font-semibold text-text-main">Exercicios</AppText>
                  <View className="flex-row items-center gap-2">
                    <ClockCountdown color="#8A8D99" size={18} weight="duotone" />
                    <AppText className="text-sm text-text-muted">
                      {!workoutStarted ? 'aguardando inicio' : restRunning ? `${formatSeconds(restLeft)} intervalo` : 'sem intervalo'}
                    </AppText>
                  </View>
                </View>

                <View className="overflow-hidden rounded-[28px] border border-border-subtle bg-bg-surface">
                  {sessionExercises.map((item, index) => (
                    <WorkoutExerciseListItem
                      key={item.id}
                      exercise={item}
                      completedSets={completedByExercise[item.id] ?? 0}
                      onPress={() => openExercise(index)}
                    />
                  ))}
                </View>
              </Animated.View>
            </>
          ) : !noteMode ? (
            <>
              <Animated.View entering={FadeInDown.duration(420)}>
                <ExerciseVisual muscle={exercise.muscle} size="lg" />
                <View className="mb-6 h-px bg-border-subtle" />
                <View className="mb-8 flex-row items-start justify-between gap-4">
                  <View className="flex-1">
                    <AppText className="text-4xl font-semibold leading-tight text-text-main">{exercise.name}</AppText>
                    <AppText className="mt-3 text-base text-text-muted">{exercise.equipment} - {exercise.muscle}</AppText>
                  </View>
                  <Pressable className="mt-2 h-12 w-12 items-center justify-center rounded-full bg-brand-primary/15" onPress={() => setInfoOpen((value) => !value)}>
                    <Info color="#A78BFA" size={24} weight="bold" />
                  </Pressable>
                </View>
              </Animated.View>

              {infoOpen ? (
                <Animated.View entering={FadeInDown.duration(320)} className="mb-7 overflow-hidden rounded-[28px] border border-border-subtle bg-bg-surface">
                  {embeddableVideo?.embedUrl ? (
                    <View className="h-52 overflow-hidden bg-black">
                      <WebView
                        allowsFullscreenVideo
                        javaScriptEnabled
                        mediaPlaybackRequiresUserAction={false}
                        source={{ uri: embeddableVideo.embedUrl }}
                      />
                    </View>
                  ) : (
                    <View className="h-36 items-center justify-center bg-bg-base px-6">
                      <PlayCircle color="#A78BFA" size={42} weight="duotone" />
                      <AppText className="mt-3 text-center text-sm text-text-muted">Este exercicio ainda nao tem video embeddavel.</AppText>
                    </View>
                  )}

                  <View className="px-5 py-5">
                    <AppText className="text-xl font-semibold text-text-main">Como executar</AppText>
                    <AppText className="mt-3 text-base leading-relaxed text-text-muted">
                      {exercise.description ?? exercise.cue}
                    </AppText>

                    <View className="mt-4 gap-3">
                      {(exercise.executionTips ?? [exercise.cue]).map((tip) => (
                        <View key={tip} className="flex-row gap-3">
                          <View className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-primary" />
                          <AppText className="flex-1 text-sm leading-relaxed text-text-muted">{tip}</AppText>
                        </View>
                      ))}
                    </View>

                    {externalVideos.length > 0 ? (
                      <View className="mt-5 gap-2">
                        {externalVideos.map((video) => (
                          <Pressable
                            key={video.id}
                            accessibilityRole="button"
                            className="min-h-[48px] flex-row items-center justify-between rounded-2xl border border-border-subtle bg-bg-base px-4"
                            onPress={() => openVideo(video.url)}
                          >
                            <View>
                              <AppText className="text-sm font-semibold text-text-main">{video.title}</AppText>
                              <AppText className="mt-0.5 text-xs text-text-muted">{video.provider === 'reels' ? 'Abrir no Instagram' : video.provider === 'tiktok' ? 'Abrir no TikTok' : 'Abrir video'}</AppText>
                            </View>
                            <LinkSimple color="#A78BFA" size={18} weight="bold" />
                          </Pressable>
                        ))}
                      </View>
                    ) : null}
                  </View>
                </Animated.View>
              ) : null}

              <Animated.View entering={FadeInDown.delay(80).duration(420)}>
                <View className="mb-5 flex-row items-center justify-between">
                  <AppText className="text-3xl font-semibold text-text-main">Series</AppText>
                  <AppText className="text-base font-medium text-text-muted">Anterior: {exercise.previous}</AppText>
                </View>

                <View className="overflow-hidden rounded-[28px] border border-border-subtle bg-bg-surface">
                  <View className="px-5 pt-6">
                    <AppText className="text-center text-base font-semibold text-text-muted">Repeticoes</AppText>
                    {exercise.sets.map((set, index) => {
                      const done = index < completedSets;

                      return (
                        <View key={set.id} className="min-h-[78px] flex-row items-center border-b border-border-subtle">
                          <View className={cn('h-11 w-11 items-center justify-center rounded-full border-2', done ? 'border-brand-primary bg-brand-primary' : 'border-text-muted')}>
                            <AppText className={cn('text-base font-semibold', done ? 'text-white' : 'text-text-muted')}>{index + 1}</AppText>
                          </View>
                          <AppText className="flex-1 text-center text-4xl font-light text-text-main">{set.reps}</AppText>
                          {set.weight ? (
                            <Pressable className="w-24 items-end rounded-2xl bg-bg-base px-3 py-2" onPress={() => openWeightEditor(index)}>
                              <AppText className="text-base font-semibold text-text-main">{getSetWeight(exercise.id, set.id, set.weight)}</AppText>
                              <AppText className="mt-0.5 text-[10px] text-brand-secondary">editar</AppText>
                            </Pressable>
                          ) : (
                            <AppText className="w-20 text-right text-base text-text-muted">{set.duration ?? ''}</AppText>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  <View
                    className="min-h-[118px] flex-row items-center justify-between px-6"
                    onLayout={(event) => {
                      intervalYRef.current = seriesYRef.current + event.nativeEvent.layout.y;
                    }}
                  >
                    <AppText className="text-2xl text-text-muted">Intervalo</AppText>
                    <AppText className={cn('text-5xl font-semibold', restRunning ? 'text-brand-secondary' : 'text-text-main')}>
                      {restRunning ? formatSeconds(restLeft) : formatSeconds(exercise.restSeconds)}
                    </AppText>
                    <Pressable
                      className={cn('h-16 min-w-[86px] items-center justify-center rounded-full border px-4', restRunning ? 'border-red-500/50 bg-red-500/15' : 'border-brand-primary/40 bg-brand-primary/12')}
                      onPress={() => {
                        if (!workoutStarted) {
                          startWorkout();
                        }

                        setRestLeft(restRunning ? 0 : exercise.restSeconds);
                      }}
                    >
                      <AppText className={cn('text-base font-semibold', restRunning ? 'text-red-400' : 'text-brand-secondary')}>
                        {restRunning ? 'Parar' : 'Iniciar'}
                      </AppText>
                    </Pressable>
                  </View>

                  <Pressable
                    className="min-h-[70px] flex-row items-center justify-center gap-3 bg-bg-elevated"
                    onPress={() => setNoteMode(true)}
                  >
                    <PencilSimple color="#8A8D99" size={22} weight="duotone" />
                    <AppText className="text-lg text-text-muted">Anotar series diferentes</AppText>
                  </Pressable>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(160).duration(420)}>
                <AppText className="mt-7 text-lg leading-relaxed text-text-muted">{exercise.cue}</AppText>
                <Pressable className="mt-6 flex-row items-center rounded-[24px] border border-border-subtle bg-bg-surface px-5 py-5">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary/12">
                    <CheckCircle color="#A78BFA" size={22} weight="duotone" />
                  </View>
                  <View className="ml-4 flex-1">
                    <AppText className="text-lg font-semibold text-text-main">Progresso do exercicio</AppText>
                    <AppText className="mt-1 text-sm text-text-muted">{completedSets}/{exercise.sets.length} series feitas hoje</AppText>
                  </View>
                </Pressable>
              </Animated.View>
            </>
          ) : (
            <Animated.View entering={FadeInDown.duration(420)}>
              <Pressable
                className="mb-10 h-14 w-32 items-center justify-center rounded-full border border-border-subtle bg-bg-surface"
                onPress={() => setNoteMode(false)}
              >
                <AppText className="text-base font-medium text-text-main">Cancelar</AppText>
              </Pressable>

              <View className="mb-6 rounded-[28px] border border-border-subtle bg-bg-surface px-5 py-7">
                <AppText className="text-3xl font-semibold text-text-main">{exercise.name}</AppText>
              </View>

              <View className="mb-6 overflow-hidden rounded-[28px] border border-border-subtle bg-bg-surface">
                <View className="px-5 py-6">
                  <AppText className="mb-6 text-2xl font-semibold text-text-main">Serie executada</AppText>
                  <View className="flex-row items-center">
                    <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-primary">
                      <AppText className="text-lg font-semibold text-white">{Math.max(1, completedSets + 1)}</AppText>
                    </View>
                    <View className="mx-5 flex-1 items-center">
                      <AppText className="text-base font-semibold text-text-muted">Repeticoes</AppText>
                      <AppText className="mt-4 text-4xl font-light text-text-main">{exercise.sets[0]?.reps}</AppText>
                    </View>
                    <View className="flex-1 items-center">
                      <AppText className="text-base font-semibold text-text-muted">Peso (kg)</AppText>
                      <TextInput
                        className="mt-4 min-w-20 text-center text-4xl font-light text-text-main"
                        keyboardType="number-pad"
                        value={customWeight}
                        onChangeText={setCustomWeight}
                        placeholderTextColor="#8A8D99"
                      />
                    </View>
                  </View>
                </View>
              </View>

              <Pressable
                className="mb-5 h-16 items-center justify-center rounded-[24px] bg-brand-primary"
                onPress={() => {
                  if (!workoutStarted) {
                    startWorkout();
                  }

                  const nextValue = Math.min(exercise.sets.length, completedSets + 1);
                  setCompletedByExercise((current) => ({ ...current, [exercise.id]: nextValue }));
                  setRestLeft(nextValue < exercise.sets.length ? exercise.restSeconds : 0);
                  setNoteMode(false);
                  requestAnimationFrame(() => {
                    scrollRef.current?.scrollTo({ y: Math.max(0, intervalYRef.current - 24), animated: true });
                  });
                }}
              >
                <AppText className="text-base font-semibold text-white">Anotar serie</AppText>
              </Pressable>

              <AppText className="px-3 text-base leading-relaxed text-text-muted">
                Esta anotacao atualiza apenas o historico de hoje. A ficha prescrita continua igual para o treinador acompanhar a evolucao.
              </AppText>
            </Animated.View>
          )}
        </ScrollView>

        <View className="absolute bottom-7 left-5 right-5 rounded-[28px] border border-white/10 bg-black/90 px-4 py-4">
          {viewMode === 'exercise' && !noteMode && !workoutFinished ? (
            <Pressable
              className="absolute -top-14 left-[18%] right-[18%] h-14 items-center justify-center rounded-full bg-brand-primary px-4"
              onPress={handlePrimaryAction}
            >
              <AppText className="text-center text-base font-semibold text-white">{primaryActionLabel}</AppText>
            </Pressable>
          ) : null}
          <View className="flex-row items-center justify-between">
            <Pressable className="h-14 w-14 items-center justify-center rounded-full bg-red-500" onPress={confirmCloseWorkout}>
              <X color="#FFFFFF" size={26} weight="bold" />
            </Pressable>
            <View className="items-center">
              <AppText className="text-4xl font-semibold text-brand-secondary">{formatSeconds(elapsed)}</AppText>
              <AppText className="mt-1 text-xs text-text-muted">
                {workoutFinished ? 'finalizado' : !workoutStarted ? 'toque para iniciar' : paused ? 'pausado' : 'rodando'}
              </AppText>
            </View>
            <Pressable className="h-14 w-14 items-center justify-center rounded-full bg-white/15" onPress={toggleTimer}>
              {!workoutStarted || paused ? <Play color="#FFFFFF" size={24} weight="fill" /> : <Pause color="#FFFFFF" size={24} weight="fill" />}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <Modal animationType="fade" transparent visible={Boolean(weightEditor)} onRequestClose={() => setWeightEditor(null)}>
        <View className="flex-1 justify-end bg-black/70 px-5 pb-7">
          <View className="rounded-[28px] border border-border-subtle bg-bg-surface px-5 py-5">
            <View className="mb-5 flex-row items-start justify-between gap-4">
              <View className="flex-1">
                <AppText className="text-2xl font-semibold text-text-main">Peso usado</AppText>
                <AppText className="mt-2 text-sm leading-relaxed text-text-muted">
                  Atualize a carga executada hoje e escolha onde repetir este ajuste.
                </AppText>
              </View>
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/12">
                <TrendUp color="#A78BFA" size={22} weight="duotone" />
              </View>
            </View>

            <View className="rounded-2xl bg-bg-base px-4 py-4">
              <AppText className="text-sm text-text-muted">Carga em kg</AppText>
              <TextInput
                autoFocus
                className="mt-2 text-4xl font-light text-text-main"
                keyboardType="decimal-pad"
                onChangeText={setWeightDraft}
                placeholder="0"
                placeholderTextColor="#8A8D99"
                value={weightDraft}
              />
            </View>

            <View className="mt-4 gap-3">
              <Pressable className="min-h-[54px] items-center justify-center rounded-2xl bg-brand-primary px-5" onPress={() => applyWeight('single')}>
                <AppText className="text-base font-semibold text-white">Atualizar so esta serie</AppText>
              </Pressable>
              <Pressable className="min-h-[54px] items-center justify-center rounded-2xl border border-border-subtle bg-bg-base px-5" onPress={() => applyWeight('exercise-next')}>
                <AppText className="text-base font-semibold text-text-main">Esta e proximas series</AppText>
              </Pressable>
              <Pressable className="min-h-[54px] items-center justify-center rounded-2xl border border-border-subtle bg-bg-base px-5" onPress={() => applyWeight('workout-next')}>
                <AppText className="text-base font-semibold text-text-main">Proximas series e exercicios</AppText>
              </Pressable>
              <Pressable className="min-h-[48px] items-center justify-center" onPress={() => setWeightEditor(null)}>
                <AppText className="text-base font-semibold text-text-muted">Cancelar</AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
