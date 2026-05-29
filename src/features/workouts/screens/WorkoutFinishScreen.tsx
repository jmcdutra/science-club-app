import * as ImagePicker from "expo-image-picker";
import Constants from "expo-constants";
import {
  Camera,
  CheckCircle,
  Flame,
  ImageSquare,
  InstagramLogo,
  TrendUp,
  Clock,
} from "phosphor-react-native";
import { Redirect, type Href, useLocalSearchParams } from "expo-router";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  BackHandler,
  Image,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { captureRef } from "react-native-view-shot";

import { AppCard } from "@/src/shared/components/ui/AppCard";
import { AppLottie } from "@/src/shared/components/ui/AppLottie";
import { AppScreen } from "@/src/shared/components/ui/AppScreen";
import { AppText } from "@/src/shared/components/ui/AppText";
import { getNativeShareModule } from "@/src/shared/utils/nativeShare";
import { useAppTheme } from "@/src/shared/theme/appTheme";
import { useAuthStore } from "@/src/features/auth/services/auth.store";

import { getWorkoutSession } from "../data/workoutSheets";
import {
  getCurrentWorkout,
  getSessionProgress,
  saveSessionProgress,
  uploadWorkoutProgressPhoto,
} from "../api/workouts";

function formatSeconds(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function parseWeightValue(value?: string) {
  const normalized = String(value || "").replace(",", ".");
  const match = normalized.match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function parseRepsValue(value?: string) {
  const normalized = String(value || "").trim();
  if (!normalized) return 0;
  const rangeMatch = normalized.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    return Math.round((Number(rangeMatch[1]) + Number(rangeMatch[2])) / 2);
  }
  const match = normalized.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function formatKg(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
}

function normalizeSetLabel(value?: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function isValidWorkoutSet(set: { type?: string; label?: string }) {
  const type = normalizeSetLabel(set.type);
  const label = normalizeSetLabel(set.label);

  return (
    type !== "warmup" &&
    type !== "preparatory" &&
    label !== "aquecimento" &&
    label !== "preparatoria" &&
    label !== "preparatorio"
  );
}

function getValidSetLabel(set: { label?: string }, validIndex: number) {
  const label = String(set.label || "").trim();
  if (label && isValidWorkoutSet(set)) return label;
  return `Série ${validIndex + 1}`;
}

function formatDeltaLabel(delta: number, suffix: string) {
  if (!delta) return `0 ${suffix}`;
  const sign = delta > 0 ? "+" : "-";
  return `${sign}${formatKg(Math.abs(delta))} ${suffix}`;
}

function getDeltaTone(delta: number, hasPrevious: boolean) {
  if (!hasPrevious) return "#A1A1AA";
  if (delta > 0) return "#A78BFA";
  if (delta < 0) return "#F59E0B";
  return "#A1A1AA";
}

function ProgressRail({
  accentColor,
  current,
  hasPrevious,
  label,
  previous,
  suffix,
  withHelper = false,
}: {
  accentColor: string;
  current: number;
  hasPrevious: boolean;
  label: string;
  previous: number;
  suffix: string;
  withHelper?: boolean;
}) {
  const maxValue = Math.max(current, previous, 1);
  const delta = current - previous;
  const deltaColor = getDeltaTone(delta, hasPrevious);
  const currentWidth = Math.max(6, (current / maxValue) * 100);
  const previousWidth = hasPrevious
    ? Math.max(6, (previous / maxValue) * 100)
    : 0;

  return (
    <View className="gap-2.5">
      <View className="flex-row items-center justify-between">
        <View>
          <AppText className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">
            {label}
          </AppText>
          {withHelper ? (
            <AppText className="mt-0.5 text-[10px] leading-[13px] text-text-muted">
              {label === "Peso"
                ? "Carga executada na série"
                : "Repetições feitas na série"}
            </AppText>
          ) : null}
        </View>
        <AppText
          className="text-[11px] font-bold"
          style={{ color: deltaColor }}
        >
          {hasPrevious ? formatDeltaLabel(delta, suffix) : "Sem histórico"}
        </AppText>
      </View>

      <View className="gap-2">
        <View>
          <View className="mb-1.5 flex-row items-center justify-between">
            <AppText className="text-[10px] font-semibold text-text-muted">
              Hoje
            </AppText>
            <AppText className="text-[10px] font-bold text-text-main">
              {formatKg(current)} {suffix}
            </AppText>
          </View>
          <View className="h-3.5 overflow-hidden rounded-full bg-bg-surface">
            <View
              className="h-full rounded-full"
              style={{
                width: `${currentWidth}%`,
                backgroundColor: accentColor,
              }}
            />
          </View>
        </View>

        <View>
          <View className="mb-1.5 flex-row items-center justify-between">
            <AppText className="text-[10px] font-semibold text-text-muted">
              Último
            </AppText>
            <AppText className="text-[10px] font-bold text-text-main">
              {hasPrevious ? `${formatKg(previous)} ${suffix}` : "-"}
            </AppText>
          </View>
          <View className="h-3.5 overflow-hidden rounded-full bg-bg-surface">
            {hasPrevious ? (
              <View
                className="h-full rounded-full"
                style={{
                  width: `${previousWidth}%`,
                  backgroundColor: "#71717A",
                }}
              />
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

function SummaryRail({
  accentColor,
  current,
  hasPrevious,
  label,
  previous,
  suffix,
}: {
  accentColor: string;
  current: number;
  hasPrevious: boolean;
  label: string;
  previous: number;
  suffix: string;
}) {
  const maxValue = Math.max(current, previous, 1);
  const delta = current - previous;
  const currentWidth = Math.max(6, (current / maxValue) * 100);
  const previousWidth = hasPrevious
    ? Math.max(6, (previous / maxValue) * 100)
    : 0;

  return (
    <View className="gap-2.5">
      <View className="flex-row items-end justify-between gap-3">
        <View className="flex-1">
          <AppText className="text-[12px] font-bold text-text-main">
            {label}
          </AppText>
          <AppText className="mt-0.5 text-[10px] leading-[14px] text-text-muted">
            {label === "Peso médio"
              ? "Média das cargas nas séries válidas"
              : "Total de repetições válidas no treino"}
          </AppText>
        </View>
        <AppText
          className="text-[11px] font-bold"
          style={{ color: getDeltaTone(delta, hasPrevious) }}
        >
          {hasPrevious ? formatDeltaLabel(delta, suffix) : "Sem histórico"}
        </AppText>
      </View>

      <View className="gap-2">
        <View className="h-4 overflow-hidden rounded-full bg-bg-surface">
          <View
            className="h-full rounded-full"
            style={{ width: `${currentWidth}%`, backgroundColor: accentColor }}
          />
        </View>
        <View className="h-2.5 overflow-hidden rounded-full bg-bg-surface">
          {hasPrevious ? (
            <View
              className="h-full rounded-full"
              style={{ width: `${previousWidth}%`, backgroundColor: "#71717A" }}
            />
          ) : null}
        </View>
      </View>

      <View className="flex-row justify-between">
        <AppText className="text-[10px] font-semibold text-text-muted">
          Hoje: {formatKg(current)} {suffix}
        </AppText>
        <AppText className="text-[10px] font-semibold text-text-muted">
          Último: {hasPrevious ? `${formatKg(previous)} ${suffix}` : "-"}
        </AppText>
      </View>
    </View>
  );
}

function StatTile({
  label,
  value,
  unit,
  icon,
  iconBackground,
  iconColor,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: ReactNode;
  iconBackground: string;
  iconColor: string;
}) {
  return (
    <AppCard className="rounded-[20px] px-4 py-4" style={{ width: "48.6%" }}>
      <View
        className="h-8 w-8 items-center justify-center rounded-full"
        style={{ backgroundColor: iconBackground }}
      >
        {icon}
      </View>
      <AppText className="mt-3 text-[11px] font-medium text-text-muted">
        {label}
      </AppText>
      <AppText className="mt-1 font-sans text-[22px] font-bold leading-none text-text-main">
        {value}
        {unit ? (
          <AppText
            className="text-[11px] font-normal text-text-muted"
            style={{ color: iconColor }}
          >
            {" "}
            {unit}
          </AppText>
        ) : null}
      </AppText>
    </AppCard>
  );
}

export function WorkoutFinishScreen() {
  const { isDark } = useAppTheme();
  const queryClient = useQueryClient();
  const composedShareRef = useRef<View>(null);
  const overlayStickerRef = useRef<View>(null);
  const { id, sessionId, elapsed, exercises } =
    useLocalSearchParams<{
      id: string;
      sessionId?: string;
      elapsed?: string;
      exercises?: string;
    }>();
  const { session: authSession } = useAuthStore();
  const { data: currentWorkoutData } = useQuery({
    queryKey: ["student-workout-current"],
    queryFn: () => getCurrentWorkout(authSession?.token!),
    enabled: !!authSession?.token,
  });
  const remoteWorkout =
    currentWorkoutData?.workout && currentWorkoutData.workout.id === id
      ? currentWorkoutData.workout
      : null;
  const session = remoteWorkout
    ? remoteWorkout.sessions.find((candidate) => candidate.id === sessionId) ||
      remoteWorkout.sessions[0]
    : getWorkoutSession(id, sessionId);
  const resolvedSessionId = session?.id || sessionId || "";
  const { data: currentProgress } = useQuery({
    queryKey: ["student-workout-progress", id, resolvedSessionId],
    queryFn: () =>
      getSessionProgress(authSession?.token!, id, resolvedSessionId),
    enabled: !!authSession?.token && !!id && !!resolvedSessionId,
  });
  const sessionExercises = session.exercises.filter(Boolean);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [lastSubmittedState, setLastSubmittedState] = useState<{
    comment: string;
    photoUri: string | null;
  } | null>(null);
  const [pendingRedirect, setPendingRedirect] = useState<Href | null>(null);
  const autoFinalizeAttemptedRef = useRef(false);

  const elapsedSeconds = Number(elapsed ?? 0);
  const completedExercises = Number(exercises ?? sessionExercises.length);
  const instagramStoriesAppId =
    Constants.expoConfig?.extra?.instagramStoriesAppId;

  const sessionHistory =
    currentWorkoutData?.historyBySession?.[resolvedSessionId] ?? [];
  const previousHistoryEntry = sessionHistory[0] ?? null;

  const currentMetrics = (() => {
    const exercises = sessionExercises.map((exercise) => {
      const completedSetsForExercise = Math.min(
        exercise.sets.length,
        Math.max(0, Number(currentProgress?.completed_sets?.[exercise.id] || 0)),
      );

      let totalVolumeKg = 0;
      let totalReps = 0;
      let bestSetKg = 0;
      let validSetCursor = 0;

      const sets = exercise.sets.map((set, setIndex) => {
        const setKey = `${exercise.id}:${set.id}`;
        const isValidSet = isValidWorkoutSet(set);
        const validSetIndex = isValidSet ? validSetCursor++ : -1;
        const performedWeightKg = parseWeightValue(
          currentProgress?.weight_overrides?.[setKey] || set.weight || "",
        );
        const performedReps = parseRepsValue(
          currentProgress?.reps_overrides?.[setKey] || set.reps || "",
        );
        const completed = setIndex < completedSetsForExercise;
        const volumeKg = completed ? performedWeightKg * performedReps : 0;

        if (completed && isValidSet) {
          totalVolumeKg += volumeKg;
          totalReps += performedReps;
          if (performedWeightKg > bestSetKg) bestSetKg = performedWeightKg;
        }

        return {
          setId: set.id,
          label: getValidSetLabel(set, Math.max(validSetIndex, 0)),
          performedWeightKg,
          performedReps,
          completed,
          isValidSet,
        };
      });
      const validCompletedSets = sets.filter(
        (set) => set.completed && set.isValidSet,
      );

      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        completedSets: validCompletedSets.length,
        totalVolumeKg,
        totalReps,
        bestSetKg,
        sets,
      };
    });

    return {
      totalVolumeKg: exercises.reduce(
        (sum, exercise) => sum + exercise.totalVolumeKg,
        0,
      ),
      totalReps: exercises.reduce(
        (sum, exercise) => sum + exercise.totalReps,
        0,
      ),
      validSets: exercises.reduce(
        (sum, exercise) => sum + exercise.completedSets,
        0,
      ),
      exercises,
    };
  })();

  const exerciseComparisons = (() => {
    const previousByExercise = new Map(
      (previousHistoryEntry?.exercises || []).map((exercise) => [
        exercise.exerciseId,
        exercise,
      ]),
    );

    return currentMetrics.exercises.map((exercise) => {
      const previous = previousByExercise.get(exercise.exerciseId);
      const previousSetsById = new Map(
        (previous?.sets || []).map((set) => [set.setId, set]),
      );
      const validSets = exercise.sets
        .filter((set) => set.completed && set.isValidSet)
        .map((set) => {
          const previousSet = previousSetsById.get(set.setId);
          const hasPrevious = Boolean(previousSet?.completed);
          return {
            setId: set.setId,
            label: set.label,
            currentWeightKg: set.performedWeightKg,
            previousWeightKg: hasPrevious
              ? Number(previousSet?.performedWeightKg || 0)
              : 0,
            currentReps: set.performedReps,
            previousReps: hasPrevious
              ? Number(previousSet?.performedReps || 0)
              : 0,
            hasPrevious,
          };
        });

      return {
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        validSets,
        currentBestSetKg: exercise.bestSetKg,
      };
    });
  })();

  const comparisonSummary = (() => {
    const validSets = exerciseComparisons.flatMap(
      (exercise) => exercise.validSets,
    );
    const previousValidSets = validSets.filter((set) => set.hasPrevious);
    const currentWeightTotal = validSets.reduce(
      (sum, set) => sum + set.currentWeightKg,
      0,
    );
    const previousWeightTotal = previousValidSets.reduce(
      (sum, set) => sum + set.previousWeightKg,
      0,
    );
    const previousReps = previousValidSets.reduce(
      (sum, set) => sum + set.previousReps,
      0,
    );

    return {
      currentAverageWeightKg: validSets.length
        ? currentWeightTotal / validSets.length
        : 0,
      previousAverageWeightKg: previousValidSets.length
        ? previousWeightTotal / previousValidSets.length
        : 0,
      hasPrevious: previousValidSets.length > 0,
      previousReps,
      repsDelta: currentMetrics.totalReps - previousReps,
      averageWeightDeltaKg:
        (validSets.length ? currentWeightTotal / validSets.length : 0) -
        (previousValidSets.length
          ? previousWeightTotal / previousValidSets.length
          : 0),
    };
  })();

  const hasUnsavedPostFinishChanges =
    submitted &&
    !!lastSubmittedState &&
    (lastSubmittedState.comment !== comment.trim() ||
      lastSubmittedState.photoUri !== photoUri);

  const saveWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!authSession?.token) {
        throw new Error("Sua sessão expirou. Entre novamente para salvar.");
      }
      if (!id || !resolvedSessionId) {
        throw new Error("Não foi possível identificar este treino.");
      }

      let photoUrl = "";
      let photoName = currentProgress?.photo_name || "";

      if (photoUri) {
        photoName = photoUri.split("/").pop() || "treino.jpg";
        const uploadResult = await uploadWorkoutProgressPhoto(authSession.token, photoUri, {
          name: photoName,
        });
        photoUrl = uploadResult.url;
      } else {
        photoUrl = currentProgress?.photo_url || "";
      }

      await saveSessionProgress(authSession.token, id, resolvedSessionId, {
        elapsed_seconds: elapsedSeconds,
        finished_at: new Date().toISOString(),
        observation: comment.trim(),
        photo_name: photoName,
        photo_url: photoUrl,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["student-workout-current"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["student-workout-progress", id, resolvedSessionId],
      });
      setLastSubmittedState({
        comment: comment.trim(),
        photoUri,
      });
      setSubmitted(true);
    },
    onError: (error) => {
      Alert.alert(
        "Erro ao salvar treino",
        error instanceof Error
          ? error.message
          : "Nao foi possivel salvar o treino agora.",
      );
    },
  });

  useEffect(() => {
    if (!currentProgress) return;

    if (!lastSubmittedState) {
      setComment(String(currentProgress.observation || ""));
      setLastSubmittedState({
        comment: String(currentProgress.observation || "").trim(),
        photoUri: null,
      });
    }

    if (currentProgress.finished_at) {
      setSubmitted(true);
      autoFinalizeAttemptedRef.current = true;
    }
  }, [currentProgress, lastSubmittedState]);

  useEffect(() => {
    if (!authSession?.token || !id || !resolvedSessionId) return;
    if (submitted || saveWorkoutMutation.isPending || autoFinalizeAttemptedRef.current) {
      return;
    }

    autoFinalizeAttemptedRef.current = true;
    void saveWorkoutMutation.mutateAsync().catch(() => {
      autoFinalizeAttemptedRef.current = false;
    });
  }, [
    authSession?.token,
    id,
    resolvedSessionId,
    saveWorkoutMutation,
    submitted,
  ]);

  useEffect(() => {
    const goToWorkoutsRoot = () => {
      setPendingRedirect("/(app)/(tabs)/workouts" as Href);
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      goToWorkoutsRoot,
    );

    return () => subscription.remove();
  }, []);

  async function pickCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permissão da câmera",
        "Autorize a câmera para registrar o treino.",
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.88,
    });
    if (!result.canceled) setPhotoUri(result.assets[0]?.uri ?? null);
  }

  async function pickLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permissão de fotos",
        "Autorize a galeria para anexar uma foto.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 5],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.88,
    });
    if (!result.canceled) setPhotoUri(result.assets[0]?.uri ?? null);
  }

  function choosePhoto() {
    Alert.alert("Foto do treino", "Registre uma foto para o histórico.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Galeria", onPress: pickLibrary },
      { text: "Câmera", onPress: pickCamera },
    ]);
  }

  async function captureComposedCard() {
    if (!composedShareRef.current) return null;
    try {
      return await captureRef(composedShareRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
    } catch {
      return null;
    }
  }

  async function captureOverlaySticker() {
    if (!overlayStickerRef.current) return null;
    try {
      return await captureRef(overlayStickerRef, {
        format: "png",
        quality: 1,
        result: "base64",
      });
    } catch {
      return null;
    }
  }

  async function shareInstagramStories() {
    const nativeShare = getNativeShareModule();
    if (!nativeShare?.shareSingle || !nativeShare?.Social?.INSTAGRAM_STORIES) {
      Alert.alert(
        "Build nativa necessária",
        "Compartilhamento direto no Instagram requer build nativa.",
      );
      return;
    }
    const stickerBase64 = await captureOverlaySticker();
    const cardUri = await captureComposedCard();
    if (!stickerBase64) {
      Alert.alert("Erro", "Não foi possível gerar o overlay.");
      return;
    }
    if (!cardUri) {
      Alert.alert("Erro", "Não foi possível gerar a imagem do treino.");
      return;
    }
    if (
      !instagramStoriesAppId ||
      instagramStoriesAppId === "REPLACE_WITH_FACEBOOK_APP_ID"
    ) {
      Alert.alert(
        "Facebook App ID ausente",
        "Configure instagramStoriesAppId no app.json.",
      );
      return;
    }
    try {
      await nativeShare.shareSingle({
        appId: instagramStoriesAppId,
        backgroundImage: cardUri,
        backgroundBottomColor: "#000000",
        backgroundTopColor: "#000000",
        social: nativeShare.Social?.INSTAGRAM_STORIES ?? "instagramstories",
        stickerImage: `data:image/png;base64,${stickerBase64}`,
      });
    } catch {
      Alert.alert("Erro", "Não foi possível abrir o Instagram Stories.");
    }
  }

  async function saveWorkout() {
    if (!hasUnsavedPostFinishChanges) {
      setPendingRedirect("/(app)/(tabs)/workouts" as Href);
      return;
    }
    if (saveWorkoutMutation.isPending) return;
    try {
      await saveWorkoutMutation.mutateAsync();
    } catch {
      return;
    }
  }

  if (pendingRedirect) {
    return <Redirect href={pendingRedirect} />;
  }

  return (
    <AppScreen hideGlow keyboard scroll={false}>
      <View
        ref={overlayStickerRef}
        collapsable={false}
        pointerEvents="none"
        style={{
          backgroundColor: "transparent",
          height: 360,
          left: -1000,
          position: "absolute",
          top: 0,
          width: 360,
        }}
      >
        <View className="flex-1 items-center justify-center px-7">
          <AppText className="text-sm font-semibold text-white">
            SCIENCE CLUB
          </AppText>
          <View className="mt-6 flex-row items-center justify-center gap-6">
            <View className="items-center">
              <AppText className="text-3xl font-semibold text-white">
                {completedExercises}
              </AppText>
              <AppText className="text-xs text-white/70">exercícios</AppText>
            </View>
            <View className="items-center rounded-full border border-brand-primary/70 bg-brand-primary/20 px-6 py-4">
              <AppText className="text-4xl font-semibold text-brand-secondary">
                {currentMetrics.validSets}
              </AppText>
              <AppText className="text-xs text-white/70">séries vál.</AppText>
            </View>
            <View className="items-center">
              <AppText className="text-3xl font-semibold text-white">
                {formatKg(currentMetrics.totalVolumeKg)}
              </AppText>
              <AppText className="text-xs text-white/70">kg válidos</AppText>
            </View>
          </View>
          <AppText className="mt-6 text-3xl font-semibold text-white">
            {formatSeconds(elapsedSeconds)}
          </AppText>
          <AppText className="mt-5 text-sm font-semibold text-white">
            @scienceclub
          </AppText>
        </View>
      </View>

      <View
        ref={composedShareRef}
        collapsable={false}
        style={{
          backgroundColor: isDark ? "#000000" : "#FFFFFF",
          height: 360,
          left: -1000,
          position: "absolute",
          top: 0,
          width: 360,
        }}
      >
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            resizeMode="cover"
            style={{
              height: "100%",
              opacity: 0.2,
              position: "absolute",
              width: "100%",
            }}
          />
        ) : null}
        <View className="flex-1 items-center justify-center px-7">
          <AppText className="text-sm font-semibold text-text-main">
            SCIENCE CLUB
          </AppText>
          <View className="mt-5 flex-row items-center justify-center gap-8">
            <View className="items-center">
              <AppText className="text-3xl font-semibold text-text-main">
                {completedExercises}
              </AppText>
              <AppText className="text-xs text-text-muted">exercícios</AppText>
            </View>
            <View className="items-center rounded-full border border-brand-primary/50 bg-brand-primary/10 px-7 py-4">
              <AppText className="text-4xl font-semibold text-brand-secondary">
                {currentMetrics.validSets}
              </AppText>
              <AppText className="text-xs text-text-muted">séries vál.</AppText>
            </View>
            <View className="items-center">
              <AppText className="text-3xl font-semibold text-text-main">
                {formatKg(currentMetrics.totalVolumeKg)}
              </AppText>
              <AppText className="text-xs text-text-muted">kg válidos</AppText>
            </View>
          </View>
          <AppText className="mt-5 text-3xl font-semibold text-text-main">
            {formatSeconds(elapsedSeconds)}
          </AppText>
          <AppText className="mt-1 text-xs text-text-muted">duração</AppText>
          <AppText className="mt-5 text-sm font-semibold text-text-main">
            @scienceclub
          </AppText>
        </View>
      </View>

      <View className="flex-1">
        <View className="flex-row items-center border-b border-border-subtle px-4 pb-3 pt-3">
          <AppText className="font-heading text-[16px] font-bold text-text-main">
            Resumo do Treino
          </AppText>
          <View className="flex-1" />
          <AppText className="text-[12px] font-semibold text-text-muted">
            {formatSeconds(elapsedSeconds)}
          </AppText>
        </View>

        <ScrollView
          bounces
          contentContainerStyle={{ paddingBottom: 132 }}
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        >
          <View className="border-b border-border-subtle px-6 pb-6 pt-5">
            <View className="items-center">
              <View className="mb-2 h-[132px] w-[132px] items-center justify-center">
                <AppLottie
                  autoPlay
                  loop
                  size={132}
                  source={require("@/assets/animations/Trophy.json")}
                />
              </View>
              <AppText className="font-heading text-[32px] font-bold text-text-main">
                Treino Finalizado!
              </AppText>
              <AppText className="mt-2 text-[14px] text-text-muted">
                {session.title}
              </AppText>
            </View>
          </View>

          <View className="px-5 pt-5">
            <View className="mb-[18px] flex-row flex-wrap justify-between gap-y-3.5">
              <StatTile
                label="Duração"
                value={formatSeconds(elapsedSeconds)}
                icon={<Clock size={14} color="#8B5CF6" weight="bold" />}
                iconBackground="rgba(139,92,246,0.12)"
                iconColor="#8B5CF6"
              />
              <StatTile
                label="Volume válido"
                value={formatKg(currentMetrics.totalVolumeKg)}
                unit="kg"
                icon={<TrendUp size={14} color="#22C55E" weight="bold" />}
                iconBackground="rgba(34,197,94,0.12)"
                iconColor="#22C55E"
              />
              <StatTile
                label="Séries válidas"
                value={String(currentMetrics.validSets)}
                icon={<CheckCircle size={14} color="#38BDF8" weight="fill" />}
                iconBackground="rgba(56,189,248,0.12)"
                iconColor="#38BDF8"
              />
              <StatTile
                label="Exercícios"
                value={`${completedExercises}/${sessionExercises.length}`}
                icon={<Flame size={14} color="#F59E0B" weight="fill" />}
                iconBackground="rgba(245,158,11,0.12)"
                iconColor="#F59E0B"
              />
            </View>

            <View className="mb-[18px] gap-3">
              <AppText className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
                Comparativo de progressão
              </AppText>

              <AppCard className="rounded-[24px] px-4 py-4">
                <View className="flex-row items-start gap-3">
                  <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-full bg-brand-primary/15">
                    <TrendUp size={16} color="#A78BFA" weight="bold" />
                  </View>
                  <View className="flex-1">
                    <AppText className="text-[15px] font-bold text-text-main">
                      Progresso sem distorcer por volume
                    </AppText>
                    <AppText className="mt-1.5 text-[12px] leading-[17px] text-text-muted">
                      Volume é peso × reps × séries, somente séries válidas.
                    </AppText>
                  </View>
                </View>

                <View className="mt-4 gap-4 rounded-[18px] bg-brand-primary/5 px-3.5 py-3.5">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <View className="h-2.5 w-2.5 rounded-full bg-brand-secondary" />
                      <AppText className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">
                        Hoje
                      </AppText>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View className="h-2.5 w-2.5 rounded-full bg-zinc-500" />
                      <AppText className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">
                        Último treino
                      </AppText>
                    </View>
                  </View>

                  <SummaryRail
                    accentColor="#A78BFA"
                    current={comparisonSummary.currentAverageWeightKg}
                    hasPrevious={comparisonSummary.hasPrevious}
                    label="Peso médio"
                    previous={comparisonSummary.previousAverageWeightKg}
                    suffix="kg"
                  />

                  <View className="h-px bg-border-subtle" />

                  <SummaryRail
                    accentColor="#38BDF8"
                    current={currentMetrics.totalReps}
                    hasPrevious={comparisonSummary.hasPrevious}
                    label="Repetições"
                    previous={comparisonSummary.previousReps}
                    suffix="reps"
                  />
                </View>

                <View className="mt-5">
                  <AppText className="text-[12px] font-bold text-text-main">
                    Por exercício e por série
                  </AppText>
                  <AppText className="mt-1 text-[11px] leading-[16px] text-text-muted">
                    Aquecimento e preparatórias não entram. Cada linha compara a
                    mesma série do treino anterior.
                  </AppText>
                </View>

                <View className="mt-2">
                  {exerciseComparisons
                    .filter((exercise) => exercise.validSets.length > 0)
                    .map((exercise, exerciseIndex) => (
                      <View
                        key={exercise.exerciseId}
                        className={
                          exerciseIndex === 0
                            ? "pt-4"
                            : "mt-4 border-t border-border-subtle pt-4"
                        }
                      >
                        <View className="mb-3 flex-row items-start justify-between gap-3">
                          <View className="flex-1">
                            <AppText className="text-[14px] font-bold leading-[19px] text-text-main">
                              {exercise.exerciseName}
                            </AppText>
                            <AppText className="mt-1 text-[10px] text-text-muted">
                              {exercise.validSets.length} série
                              {exercise.validSets.length === 1 ? "" : "s"} válida
                              {exercise.validSets.length === 1 ? "" : "s"}
                            </AppText>
                          </View>
                          <View className="rounded-full bg-brand-primary/10 px-2.5 py-1">
                            <AppText className="text-[9px] font-semibold text-brand-secondary">
                              Máx. {formatKg(exercise.currentBestSetKg)} kg
                            </AppText>
                          </View>
                        </View>

                        <View className="gap-4">
                          {exercise.validSets.map((set, setIndex) => (
                            <View
                              key={set.setId}
                              className={
                                setIndex === 0
                                  ? "gap-3"
                                  : "gap-3 border-t border-border-subtle pt-3"
                              }
                            >
                              <View className="flex-row items-center justify-between">
                                <AppText className="text-[12px] font-bold text-text-main">
                                  {set.label}
                                </AppText>
                                <AppText className="text-[10px] font-semibold text-brand-secondary">
                                  série válida
                                </AppText>
                              </View>

                              <ProgressRail
                                accentColor="#A78BFA"
                                current={set.currentWeightKg}
                                hasPrevious={set.hasPrevious}
                                label="Peso"
                                previous={set.previousWeightKg}
                                suffix="kg"
                                withHelper
                              />
                              <ProgressRail
                                accentColor="#38BDF8"
                                current={set.currentReps}
                                hasPrevious={set.hasPrevious}
                                label="Reps"
                                previous={set.previousReps}
                                suffix="reps"
                                withHelper
                              />
                            </View>
                          ))}
                        </View>
                      </View>
                    ))}

                  {exerciseComparisons.every(
                    (exercise) => exercise.validSets.length === 0,
                  ) ? (
                    <View className="rounded-2xl bg-bg-surface px-4 py-4">
                      <AppText className="text-[12px] font-semibold text-text-main">
                        Nenhuma série válida concluída
                      </AppText>
                      <AppText className="mt-1 text-[11px] leading-[16px] text-text-muted">
                        Séries de aquecimento ou preparação não entram neste
                        comparativo.
                      </AppText>
                    </View>
                  ) : null}
                </View>
              </AppCard>
            </View>

            <View className="mb-[18px]">
              <AppText className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
                Enviar foto ao coach
              </AppText>
              <Pressable
                accessibilityRole="button"
                className="min-h-[56px] flex-row items-center justify-center gap-2.5 rounded-[14px] px-4"
                onPress={choosePhoto}
                style={{
                  backgroundColor: photoUri
                    ? "rgba(34,197,94,0.08)"
                    : isDark
                      ? "#111111"
                      : "#F7F7F7",
                  borderColor: photoUri
                    ? "rgba(34,197,94,0.36)"
                    : isDark
                      ? "#2A2A2A"
                      : "#D4D4D8",
                  borderStyle: photoUri ? "solid" : "dashed",
                  borderWidth: 1,
                }}
              >
                {photoUri ? (
                  <CheckCircle size={16} color="#22C55E" weight="fill" />
                ) : (
                  <Camera
                    size={16}
                    color={isDark ? "#A1A1AA" : "#71717A"}
                    weight="bold"
                  />
                )}
                <AppText
                  className={
                    photoUri
                      ? "text-[13px] font-semibold text-[#22C55E]"
                      : "text-[13px] font-semibold text-text-muted"
                  }
                >
                  {photoUri
                    ? "Foto selecionada"
                    : "Tirar foto ou escolher da galeria"}
                </AppText>
              </Pressable>

              {photoUri ? (
                <View className="mt-3 overflow-hidden rounded-2xl border border-border-subtle">
                  <Image
                    source={{ uri: photoUri }}
                    resizeMode="cover"
                    style={{ height: 224, width: "100%" }}
                  />
                  <Pressable
                    className="min-h-[46px] flex-row items-center justify-center gap-2 bg-bg-surface"
                    onPress={choosePhoto}
                  >
                    <ImageSquare size={15} color="#A78BFA" weight="bold" />
                    <AppText className="text-[12px] font-bold text-brand-secondary">
                      Trocar foto
                    </AppText>
                  </Pressable>
                </View>
              ) : null}
            </View>

            <View className="mb-[18px]">
              <AppText className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
                Observações para o coach
              </AppText>
              <TextInput
                multiline
                onChangeText={setComment}
                placeholder="Ex: Senti dor no ombro direito no supino. Aumentei a carga no tríceps..."
                placeholderTextColor={isDark ? "#52525B" : "#9CA3AF"}
                style={{
                  backgroundColor: isDark ? "#111111" : "#F7F7F7",
                  borderColor: isDark ? "#262626" : "#E5E7EB",
                  borderRadius: 12,
                  borderWidth: 1,
                  color: isDark ? "#FFFFFF" : "#111827",
                  minHeight: 94,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  textAlignVertical: "top",
                }}
                value={comment}
              />
            </View>

            {submitted ? (
              <View className="gap-3">
                <View
                  className="flex-row items-center gap-2.5 rounded-2xl px-4 py-3"
                  style={{
                    backgroundColor: "rgba(139,92,246,0.08)",
                    borderColor: "rgba(139,92,246,0.2)",
                    borderWidth: 1,
                  }}
                >
                  <CheckCircle size={18} color="#A78BFA" weight="fill" />
                  <AppText className="text-[13px] font-bold text-brand-secondary">
                    Registro do treino salvo com sucesso
                  </AppText>
                </View>

                <Pressable
                  accessibilityRole="button"
                  className="min-h-[56px] flex-row items-center justify-center gap-2 rounded-[18px] px-4"
                  onPress={shareInstagramStories}
                  style={{
                    backgroundColor: "#E11D48",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.12)",
                    shadowColor: "rgba(225,29,72,0.30)",
                    shadowOpacity: 1,
                    shadowRadius: 18,
                    shadowOffset: { width: 0, height: 12 },
                    elevation: 10,
                  }}
                >
                  <InstagramLogo size={18} color="#FFFFFF" weight="bold" />
                  <AppText className="text-[13px] font-bold text-white">
                    Compartilhar no Instagram
                  </AppText>
                </Pressable>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View className="border-t border-border-subtle bg-bg-base px-5 pb-7 pt-4">
          <Pressable
            accessibilityRole="button"
            disabled={saveWorkoutMutation.isPending || !submitted}
            onPress={saveWorkout}
            className="min-h-[52px] flex-row items-center justify-center gap-2.5 overflow-hidden rounded-[14px] px-4"
            style={({ pressed }) => ({
              width: "100%",
              backgroundColor:
                saveWorkoutMutation.isPending || !submitted
                  ? "#1A1A1A"
                  : "#7C3AED",
              borderWidth: 1,
              borderColor:
                saveWorkoutMutation.isPending || !submitted
                  ? "transparent"
                  : "rgba(255,255,255,0.12)",
              opacity: saveWorkoutMutation.isPending || !submitted ? 0.5 : 1,
              transform: [{ scale: pressed && !(saveWorkoutMutation.isPending || !submitted) ? 0.97 : 1 }],
              shadowColor:
                saveWorkoutMutation.isPending || !submitted
                  ? "transparent"
                  : "rgba(124,58,237,0.30)",
              shadowOpacity: saveWorkoutMutation.isPending || !submitted ? 0 : 1,
              shadowRadius: saveWorkoutMutation.isPending || !submitted ? 0 : 18,
              shadowOffset: { width: 0, height: 12 },
              elevation: saveWorkoutMutation.isPending || !submitted ? 0 : 8,
            })}
          >
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: 1,
                backgroundColor: "rgba(255,255,255,0.18)",
                opacity: saveWorkoutMutation.isPending || !submitted ? 0 : 1,
              }}
            />
            <CheckCircle size={18} color="#FFFFFF" weight="fill" />
            <AppText className="text-center text-[15px] font-semibold text-white">
            {!submitted
              ? "Finalizando treino..."
              : hasUnsavedPostFinishChanges
                ? "Enviar considerações"
                : "Voltar aos treinos"}
            </AppText>
          </Pressable>
        </View>
      </View>
    </AppScreen>
  );
}
