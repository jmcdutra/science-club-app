import {
  CaretRight,
  CaretLeft,
  Check,
  CheckCircle,
  Clock,
  LinkSimple,
  Minus,
  Pause,
  PencilSimple,
  Play,
  Plus,
  Question,
  X,
} from "phosphor-react-native";
import { router, type Href, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
  type ScrollView as ScrollViewType,
} from "react-native";
import { Image } from "expo-image";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { WebView } from "react-native-webview";

import { AppButton } from "@/src/shared/components/ui/AppButton";
import { AppText } from "@/src/shared/components/ui/AppText";
import { resolveApiUrl } from "@/src/shared/api/apiClient";
import { useAppTheme } from "@/src/shared/theme/appTheme";
import { cn } from "@/src/shared/utils/cn";
import { useAuthStore } from "@/src/features/auth/services/auth.store";

import { WorkoutNativeBottomSheet } from "../components/WorkoutNativeBottomSheet";
import {
  getWorkoutSession,
  getWorkoutSheet,
  workoutSheets,
  type WorkoutSet,
  type WorkoutExerciseVideo,
} from "../data/workoutSheets";
import {
  getCurrentWorkout,
  getSessionProgress,
  saveSessionProgress,
} from "../api/workouts";

type SetEditorState = { exerciseIndex: number; setIndex: number };
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SESSION_IMAGES = [
  require("@/assets/images/photoshoot/photoshoot-21.jpeg"),
  require("@/assets/images/photoshoot/photoshoot-31.jpeg"),
  require("@/assets/images/photoshoot/photoshoot-28.jpeg"),
  require("@/assets/images/photoshoot/photoshoot-17.jpeg"),
  require("@/assets/images/photoshoot/photoshoot-6.jpeg"),
  require("@/assets/images/photoshoot/photoshoot-29.jpeg"),
  require("@/assets/images/photoshoot/photoshoot-24.jpeg"),
  require("@/assets/images/photoshoot/photoshoot-30.jpeg"),
];

function formatSeconds(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function weightKey(eId: string, sId: string) {
  return `${eId}:${sId}`;
}
function repsKey(eId: string, sId: string) {
  return `${eId}:${sId}`;
}

function parseWeight(value?: string) {
  const match = value?.replace(",", ".").match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function formatWeight(value: string) {
  const clean = value.trim().replace(",", ".");
  if (!clean) return "0kg";
  return /[a-zA-Z]/.test(clean) ? clean : `${clean}kg`;
}

function normalizeReps(value: string) {
  const parts = value
    .split("-")
    .map((part) => parseInt(part.trim(), 10))
    .filter((part) => Number.isFinite(part));

  if (parts.length === 2) return String(Math.round((parts[0] + parts[1]) / 2));

  const direct = parseInt(value, 10);
  return Number.isFinite(direct) ? String(direct) : "10";
}

function extractPreviousWeight(previous?: string) {
  const match = previous?.replace(",", ".").match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function formatVolumeTon(sets: WorkoutSet[]) {
  const totalKg = sets.reduce((sum, set) => {
    const weight = parseWeight(set.weight);
    const reps = parseInt(set.reps || "0", 10) || 0;
    return sum + weight * reps;
  }, 0);

  if (!totalKg) return null;
  return `${(totalKg / 1000).toFixed(1).replace(".", ",")} ton`;
}

function formatPreviousHeadline(previous: string, sets: WorkoutSet[]) {
  const weightedSets = sets.filter((set) => parseWeight(set.weight) > 0);

  if (weightedSets.length > 0) {
    const groups: string[] = [];
    let currentWeight = parseWeight(weightedSets[0].weight);
    let currentCount = 0;

    weightedSets.forEach((set) => {
      const weight = parseWeight(set.weight);
      if (weight === currentWeight) {
        currentCount += 1;
        return;
      }
      groups.push(
        currentCount > 1
          ? `${currentWeight}x${currentCount}`
          : `${currentWeight}`,
      );
      currentWeight = weight;
      currentCount = 1;
    });

    groups.push(
      currentCount > 1
        ? `${currentWeight}x${currentCount}`
        : `${currentWeight}`,
    );

    if (groups.length > 1) return groups.join(" + ");

    const first = weightedSets[0];
    return `${parseWeight(first.weight)}kg × ${first.reps}`;
  }

  const durationSet = sets.find((set) => set.duration);
  if (durationSet?.duration) return durationSet.duration;

  const bodyweightSet = sets[0];
  if (bodyweightSet?.reps) return `${bodyweightSet.reps} reps`;

  return previous;
}

function getSetLabel(set: WorkoutSet, index: number) {
  if (set.label?.trim()) return set.label.trim();
  if (index === 0) return "Aquecimento";
  if (index === 1) return "Preparatório";
  return `Série ${index - 1}`;
}

function buildExerciseRecommendation(exercise: {
  executionTips?: string[];
  cue?: string;
  description?: string;
}) {
  const tips = (exercise.executionTips ?? [])
    .map((tip) => tip.trim())
    .filter(Boolean);

  if (tips.length > 0) return tips.join("\n");
  if (exercise.cue?.trim()) return exercise.cue.trim();
  if (exercise.description?.trim()) return exercise.description.trim();
  return "Siga a orientação montada pela equipe para esta execução.";
}

function normalizeVideoEmbedUrl(video: WorkoutExerciseVideo) {
  if (video.provider === "own") return video.url;

  if (video.embedUrl) return video.embedUrl;

  if (video.provider === "youtube") {
    const match = video.url.match(
      /(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{6,})/,
    );
    return match?.[1] ? `https://www.youtube.com/embed/${match[1]}` : video.url;
  }

  if (video.provider === "tiktok") {
    const match = video.url.match(/\/video\/(\d+)/);
    return match?.[1] ? `https://www.tiktok.com/embed/v2/${match[1]}` : video.url;
  }

  if (video.provider === "reels") {
    const match = video.url.match(/instagram\.com\/(?:reel|reels)\/([^/?]+)/);
    return match?.[1]
      ? `https://www.instagram.com/reel/${match[1]}/embed`
      : video.url;
  }

  return undefined;
}

function buildVideoHtml(url: string) {
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      <style>
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #000;
        }

        video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: #000;
        }
      </style>
    </head>
    <body>
      <video controls playsinline webkit-playsinline preload="metadata">
        <source src="${url.replace(/"/g, "&quot;")}" type="video/mp4" />
      </video>
    </body>
  </html>`;
}

const MUSCLE_COLOR: Record<string, string> = {
  Abdomen: "#8B5CF6",
  Core: "#8B5CF6",
  Quadriceps: "#F59E0B",
  Pernas: "#F59E0B",
  Dorsais: "#38BDF8",
  Biceps: "#A78BFA",
  Triceps: "#C084FC",
  Peitoral: "#FF6B9A",
  Posterior: "#FFB86B",
  Ombros: "#7DD3FC",
  Gluteos: "#FB7185",
  Panturrilhas: "#FCD34D",
};

const MUSCLE_LABELS: Record<string, string> = {
  Abdomen: "Abdomen",
  Biceps: "Biceps",
  Core: "Core",
  Dorsais: "Costas",
  Gluteos: "Gluteos",
  Ombros: "Ombros",
  Panturrilhas: "Panturrilhas",
  Peitoral: "Peito",
  Pernas: "Pernas",
  Posterior: "Posterior",
  Quadriceps: "Quadriceps",
  Triceps: "Triceps",
};

function isGenericWorkoutTitle(title: string) {
  const normalized = title.trim().toLowerCase();
  return (
    normalized.startsWith("treino") || normalized.startsWith("cima e baixo")
  );
}

function getWorkoutDisplayTitle(session: { title: string; muscles: string[] }) {
  if (!isGenericWorkoutTitle(session.title)) return session.title;

  const visibleMuscles = session.muscles
    .slice(0, 2)
    .map((muscle) => MUSCLE_LABELS[muscle] ?? muscle);

  if (visibleMuscles.length === 2)
    return `${visibleMuscles[0]} e ${visibleMuscles[1]}`;
  if (visibleMuscles.length === 1) return visibleMuscles[0];
  return session.title;
}

function ExerciseHelpSheet({
  visible,
  onClose,
  title,
  image,
  exercise,
  helpVideos,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  image: number;
  exercise: {
    name: string;
    muscle: string;
    equipment: string;
    cue: string;
    description?: string;
    executionTips?: string[];
    sets: WorkoutSet[];
  };
  helpVideos: {
    id: string;
    title: string;
    url: string;
    provider: WorkoutExerciseVideo["provider"];
    embedUrl?: string;
  }[];
}) {
  const exerciseRecommendation = buildExerciseRecommendation({
    executionTips: exercise.executionTips,
    cue: exercise.cue,
    description: exercise.description,
  });

  return (
    <WorkoutNativeBottomSheet
      visible={visible}
      onVisibleChange={(next) => !next && onClose()}
    >
      <View style={{ backgroundColor: "#090909", paddingBottom: 28 }}>
        <View
          style={{
            height: 214,
            overflow: "hidden",
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255,255,255,0.10)",
          }}
        >
          <Image
            source={image}
            contentFit="cover"
            contentPosition="center"
            style={{ position: "absolute", inset: 0 }}
          />
          <View
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(6,6,8,0.34)",
            }}
          />
          <Svg pointerEvents="none" style={{ position: "absolute", inset: 0 }}>
            <Defs>
              <SvgLinearGradient id="helpTop" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#09090B" stopOpacity="0.12" />
                <Stop offset="0.44" stopColor="#09090B" stopOpacity="0.32" />
                <Stop offset="1" stopColor="#090909" stopOpacity="0.95" />
              </SvgLinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#helpTop)" />
          </Svg>
          <View
            style={{ position: "absolute", left: 20, right: 20, bottom: 16 }}
          >
            <View
              style={{
                alignSelf: "flex-start",
                borderRadius: 999,
                backgroundColor: "rgba(18,12,28,0.42)",
                borderWidth: 1,
                borderColor: "rgba(139,92,246,0.34)",
                paddingHorizontal: 9,
                paddingVertical: 3,
                marginBottom: 8,
              }}
            >
              <AppText className="text-[9px] font-bold uppercase tracking-[0.12em] text-brand-secondary">
                Ajuda
              </AppText>
            </View>
            <AppText
              className="font-heading text-[28px] font-bold text-white"
              style={{ letterSpacing: -0.5 }}
            >
              {exercise.name}
            </AppText>
            <AppText className="mt-1 text-xs font-medium text-white/55">
              {title} · {exercise.muscle} · {exercise.equipment}
            </AppText>
          </View>
        </View>

        <View style={{ flexShrink: 1, minHeight: 0, maxHeight: "100%" }}>
          <ScrollView
            bounces={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 12,
              gap: 16,
            }}
            showsVerticalScrollIndicator={false}
          >
            <View>
              <AppText className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                Execução
              </AppText>
              <AppText className="text-sm leading-6 text-text-muted">
                {exercise.description ?? exercise.cue}
              </AppText>
              {helpVideos.length > 0 ? (
                <View className="mt-4 gap-3">
                  {helpVideos.map((video) => {
                    if (video.provider === "own") {
                      const directVideoUrl = resolveApiUrl(video.url);

                      if (!directVideoUrl) return null;

                      return (
                        <View
                          key={video.id}
                          className="overflow-hidden rounded-[18px] border border-border-subtle bg-black"
                        >
                          <View className="border-b border-white/10 px-3 py-2">
                            <AppText className="text-xs font-semibold text-white/80">
                              {video.title}
                            </AppText>
                          </View>
                          <View className="h-52">
                            <WebView
                              allowsFullscreenVideo
                              allowsInlineMediaPlayback
                              javaScriptEnabled
                              mediaPlaybackRequiresUserAction={false}
                              originWhitelist={["*"]}
                              scrollEnabled={false}
                              source={{ html: buildVideoHtml(directVideoUrl) }}
                            />
                          </View>
                        </View>
                      );
                    }

                    if (video.embedUrl) {
                      return (
                        <View
                          key={video.id}
                          className="overflow-hidden rounded-[18px] border border-border-subtle bg-black"
                        >
                          <View className="border-b border-white/10 px-3 py-2">
                            <AppText className="text-xs font-semibold text-white/80">
                              {video.title}
                            </AppText>
                          </View>
                          <View className="h-52">
                            <WebView
                              allowsFullscreenVideo
                              allowsInlineMediaPlayback
                              javaScriptEnabled
                              mediaPlaybackRequiresUserAction={false}
                              source={{ uri: video.embedUrl }}
                            />
                          </View>
                        </View>
                      );
                    }

                    return (
                      <Pressable
                        key={video.id}
                        className="flex-row items-center justify-between rounded-[14px] border border-border-subtle px-4 py-3"
                        onPress={() => {
                          const resolvedVideoUrl = resolveApiUrl(video.url);
                          if (resolvedVideoUrl) Linking.openURL(resolvedVideoUrl);
                        }}
                      >
                        <AppText className="text-sm font-semibold text-text-main">
                          {video.title}
                        </AppText>
                        <LinkSimple color="#A78BFA" size={15} weight="bold" />
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>

            <View>
              <AppText className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                Recomendação
              </AppText>
              <AppText className="text-sm leading-6 text-text-muted">
                {exerciseRecommendation}
              </AppText>
            </View>
          </ScrollView>
        </View>

        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: "#1A1A1A",
            paddingHorizontal: 20,
            paddingTop: 16,
          }}
        >
          <AppButton onPress={onClose} variant="secondary">
            Fechar
          </AppButton>
        </View>
      </View>
    </WorkoutNativeBottomSheet>
  );
}

function RestOverlay({
  accent,
  onSkip,
  seconds,
  total,
  visible,
}: {
  accent: string;
  onSkip: () => void;
  seconds: number;
  total: number;
  visible: boolean;
}) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? seconds / total : 0;
  const strokeOffset = useSharedValue(circumference * (1 - progress));

  useEffect(() => {
    strokeOffset.value = withTiming(circumference * (1 - progress), {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [circumference, progress, strokeOffset]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeOffset.value,
  }));

  if (!visible) return null;

  return (
    <View
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 120,
        elevation: 120,
        backgroundColor: "rgba(0,0,0,0.84)",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingBottom: 28,
      }}
    >
      <AppText className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
        Descanso
      </AppText>

      <View
        style={{
          width: 130,
          height: 130,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <Svg width={130} height={130} style={{ position: "absolute" }}>
          <Circle
            cx={65}
            cy={65}
            fill="none"
            r={radius}
            stroke="rgba(139,92,246,0.14)"
            strokeWidth={5}
          />
          <AnimatedCircle
            animatedProps={animatedProps}
            cx={65}
            cy={65}
            fill="none"
            r={radius}
            stroke={accent}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeLinecap="round"
            strokeWidth={5}
            transform="rotate(-90 65 65)"
          />
        </Svg>
        <AppText
          className="font-heading text-[42px] font-bold text-white"
          style={{ letterSpacing: -2 }}
        >
          {seconds}
        </AppText>
        <AppText className="mt-1 text-[11px] font-medium text-white/40">
          segundos
        </AppText>
      </View>

      <AppText className="mb-5 text-sm text-white/55">
        Próxima série em instantes...
      </AppText>

      <Pressable
        accessibilityRole="button"
        onPress={onSkip}
        style={({ pressed }) => ({
          minHeight: 48,
          width: "100%",
          maxWidth: 320,
          marginTop: 6,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.18)",
          backgroundColor: "rgba(255,255,255,0.12)",
          paddingHorizontal: 24,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <AppText className="text-sm font-semibold text-white">
          Pular descanso
        </AppText>
      </Pressable>
    </View>
  );
}

function ExitWorkoutPrompt({
  elapsed,
  onClose,
  onExit,
  onSaveAndExit,
  onResume,
  totalSets,
  visible,
  doneSets,
}: {
  elapsed: number;
  onClose: () => void;
  onExit: () => void;
  onSaveAndExit: () => void;
  onResume: () => void;
  totalSets: number;
  visible: boolean;
  doneSets: number;
}) {
  function ActionButton({
    label,
    onPress,
    variant,
  }: {
    label: string;
    onPress: () => void;
    variant: "primary" | "danger" | "secondary";
  }) {
    const palette =
      variant === "primary"
        ? {
            backgroundColor: "#8B5CF6",
            borderColor: "rgba(255,255,255,0.12)",
            textColor: "#FFFFFF",
            shadowColor: "rgba(139,92,246,0.34)",
          }
        : variant === "danger"
          ? {
              backgroundColor: "#DC2626",
              borderColor: "rgba(255,255,255,0.10)",
              textColor: "#FFFFFF",
              shadowColor: "transparent",
            }
          : {
              backgroundColor: "#18181B",
              borderColor: "rgba(255,255,255,0.10)",
              textColor: "#FFFFFF",
              shadowColor: "transparent",
            };

    return (
      <Pressable
        accessibilityRole="button"
        className="w-full min-h-[54px] items-center justify-center overflow-hidden rounded-2xl"
        onPress={onPress}
        style={{
          width: "100%",
          backgroundColor: palette.backgroundColor,
          borderWidth: 1,
          borderColor: palette.borderColor,
          shadowColor: palette.shadowColor,
          shadowOpacity: variant === "primary" ? 1 : 0,
          shadowRadius: variant === "primary" ? 22 : 0,
          shadowOffset: { width: 0, height: 12 },
          elevation: variant === "primary" ? 8 : 0,
        }}
      >
        {variant !== "secondary" ? (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: 1,
              backgroundColor: "rgba(255,255,255,0.18)",
            }}
          />
        ) : null}
        <AppText
          className="text-center text-[15px] font-semibold"
          style={{ color: palette.textColor }}
        >
          {label}
        </AppText>
      </Pressable>
    );
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.72)",
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            borderTopLeftRadius: 40,
            borderTopRightRadius: 40,
            backgroundColor: "#101010",
            paddingHorizontal: 22,
            paddingTop: 14,
            paddingBottom: 32,
            borderTopWidth: 1,
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          <View className="mb-4 items-center">
            <View className="mb-4 h-1.5 w-12 rounded-full bg-white/10" />
            <AppText className="font-heading text-[20px] font-bold text-white">
              Sair do treino?
            </AppText>
            <AppText className="mt-1 text-center text-[13px] leading-5 text-white/55">
              Você completou {doneSets} de {totalSets} séries em{" "}
              {formatSeconds(elapsed)}.
            </AppText>
          </View>

          <View className="gap-3">
            <ActionButton
              label="Finalizar"
              onPress={onSaveAndExit}
              variant="primary"
            />
            <ActionButton label="Descartar" onPress={onExit} variant="danger" />
            <ActionButton
              label="Continuar"
              onPress={onResume}
              variant="secondary"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function WorkoutSessionScreen() {
  const { id, sessionId: routeSessionId, exerciseId } = useLocalSearchParams<{
    id: string;
    sessionId?: string;
    exerciseId?: string;
  }>();
  const workoutId = id ?? "";
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { session: authSession } = useAuthStore();
  const { data: currentWorkoutData } = useQuery({
    queryKey: ["student-workout-current"],
    queryFn: () => getCurrentWorkout(authSession?.token!),
    enabled: !!authSession?.token,
  });
  const remoteWorkout =
    currentWorkoutData?.workout && currentWorkoutData.workout.id === workoutId
      ? currentWorkoutData.workout
      : null;
  const hasLocalFallback = workoutSheets.some((item) => item.id === workoutId);
  const localWorkoutSheet = hasLocalFallback ? getWorkoutSheet(workoutId) : null;
  const session = remoteWorkout
    ? remoteWorkout.sessions.find((s) => s.id === routeSessionId) ||
      remoteWorkout.sessions[0]
    : localWorkoutSheet
      ? getWorkoutSession(workoutId, routeSessionId)
      : null;
  if (!session) return null;
  const currentSessionId = session.id;
  const sessionExercises = session.exercises.filter(Boolean);
  const localSession =
    localWorkoutSheet?.sessions.find((item) => item.id === session.id) ??
    localWorkoutSheet?.sessions[0] ??
    null;
  const initialIndex = Math.max(
    0,
    sessionExercises.findIndex((e) => e.id === exerciseId),
  );
  const scrollRef = useRef<ScrollViewType>(null);
  const seriesYRef = useRef(0);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [completedByExercise, setCompletedByExercise] = useState<
    Record<string, number>
  >({});
  const [elapsed, setElapsed] = useState(0);
  const [restLeft, setRestLeft] = useState(0);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [workoutFinished, setWorkoutFinished] = useState(false);
  const [paused, setPaused] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [weightOverrides, setWeightOverrides] = useState<
    Record<string, string>
  >({});
  const [repsOverrides, setRepsOverrides] = useState<Record<string, string>>(
    {},
  );
  const [setsByExercise, setSetsByExercise] = useState<
    Record<string, WorkoutSet[]>
  >({});
  const [setEditor, setSetEditor] = useState<SetEditorState | null>(null);
  const [weightDraft, setWeightDraft] = useState("");
  const [repsDraft, setRepsDraft] = useState("");
  const [restElapsedSeconds, setRestElapsedSeconds] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const [startedAt, setStartedAt] = useState<string | null>(null);

  const { data: remoteProgress } = useQuery({
    queryKey: ["student-workout-progress", workoutId, currentSessionId],
    queryFn: () => getSessionProgress(authSession?.token!, workoutId, currentSessionId),
    enabled: !!authSession?.token && !!workoutId && !!currentSessionId,
  });
  const exercise = sessionExercises[currentIndex] ?? sessionExercises[0];
  const sessionDisplayTitle = getWorkoutDisplayTitle(session);
  const localExercise = localSession?.exercises.find(
    (item) => item.id === exercise.id,
  );
  const sessionImageIndex = Math.max(
    0,
    localWorkoutSheet?.sessions.findIndex((item) => item.id === session.id) ?? 0,
  );
  const sessionImage =
    exercise.coverUrl
      ? { uri: resolveApiUrl(exercise.coverUrl) ?? exercise.coverUrl }
      : SESSION_IMAGES[sessionImageIndex % SESSION_IMAGES.length];
  const getExerciseSets = (
    item: (typeof sessionExercises)[number],
  ): WorkoutSet[] => setsByExercise[item.id] ?? item.sets;
  const activeExerciseSets = getExerciseSets(exercise);
  const exerciseVideos: WorkoutExerciseVideo[] =
    (exercise as any)?.videos?.length
      ? ((exercise as any).videos as WorkoutExerciseVideo[])
      : localExercise?.videos ?? [];
  const exerciseDescription =
    exercise.description ?? localExercise?.description;
  const exerciseExecutionTips =
    exercise.executionTips ?? localExercise?.executionTips ?? [];
  const previousHeadline = formatPreviousHeadline(
    exercise.previous,
    activeExerciseSets,
  );
  const previousVolume = formatVolumeTon(activeExerciseSets);
  const previousWeight = extractPreviousWeight(exercise.previous) ?? 50;

  function getDisplayWeight(set: WorkoutSet, index: number) {
    const source = getSetWeight(exercise.id, set.id, set.weight);
    if (source) return source;
    const weight = previousWeight + Math.max(0, index - 1) * 5;
    return `${weight}kg`;
  }
  const helpVideos = exerciseVideos.map((video) => ({
    id: video.id,
    title: video.title,
    provider: video.provider,
    url: resolveApiUrl(video.url) ?? video.url,
    embedUrl: normalizeVideoEmbedUrl(video),
  }));
  const exerciseRecommendation = buildExerciseRecommendation({
    executionTips: exerciseExecutionTips,
    cue: exercise.cue,
    description: exerciseDescription,
  });
  const completedSets = completedByExercise[exercise.id] ?? 0;
  const currentSetRestSeconds =
    activeExerciseSets[
      Math.min(completedSets, Math.max(activeExerciseSets.length - 1, 0))
    ]?.restSeconds ?? exercise.restSeconds;
  const restRunning = restLeft > 0;
  const totalSets = sessionExercises.reduce(
    (sum, item) => sum + getExerciseSets(item).length,
    0,
  );
  const completedSetsTotal = sessionExercises.reduce(
    (t, item) => t + (completedByExercise[item.id] ?? 0),
    0,
  );
  const completedExercisesTotal = sessionExercises.filter(
    (item) =>
      (completedByExercise[item.id] ?? 0) >= getExerciseSets(item).length,
  ).length;
  const progressionsTotal = sessionExercises.reduce((t, item) => {
    const done = completedByExercise[item.id] ?? 0;
    return (
      t +
      getExerciseSets(item).filter((set, i) => {
        const override = weightOverrides[weightKey(item.id, set.id)];
        return (
          i < done &&
          override &&
          parseWeight(override) > parseWeight(set.weight)
        );
      }).length
    );
  }, 0);
  const exerciseDone = completedSets >= activeExerciseSets.length;
  const isLastExercise = currentIndex >= sessionExercises.length - 1;
  const timerRunning = workoutStarted && !workoutFinished && !paused;
  const progressPercent =
    completedSetsTotal === 0
      ? 0
      : Math.max(3, (completedSetsTotal / Math.max(1, totalSets)) * 100);
  const muscleAccent = MUSCLE_COLOR[exercise.muscle] ?? "#8B5CF6";

  useEffect(() => {
    if (!timerRunning) return undefined;
    const timer = setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => clearInterval(timer);
  }, [timerRunning]);

  useEffect(() => {
    if (!timerRunning || restLeft <= 0) return undefined;
    const timer = setInterval(() => {
      setRestLeft((v) => Math.max(0, v - 1));
      setRestElapsedSeconds((v) => v + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timerRunning, restLeft]);

  useEffect(() => {
    if (!remoteProgress) return;
    setCompletedByExercise(remoteProgress.completed_sets || {});
    setWeightOverrides(remoteProgress.weight_overrides || {});
    setRepsOverrides(remoteProgress.reps_overrides || {});
    setElapsed(remoteProgress.elapsed_seconds || 0);
    setRestElapsedSeconds(remoteProgress.rest_elapsed_seconds || 0);
    setRestLeft(remoteProgress.rest_left_seconds || 0);
    setRestTotal(
      remoteProgress.rest_left_seconds > 0
        ? remoteProgress.rest_left_seconds +
            (remoteProgress.rest_elapsed_seconds || 0)
        : 0,
    );
    setStartedAt(remoteProgress.started_at || null);
    setWorkoutStarted(Boolean(remoteProgress.started_at));
  }, [remoteProgress]);

  useEffect(() => {
    if (!authSession?.token || !workoutId || !currentSessionId) return;
    const timer = setInterval(() => {
      saveSessionProgress(authSession.token, workoutId, currentSessionId, {
        completed_sets: completedByExercise,
        weight_overrides: weightOverrides,
        reps_overrides: repsOverrides,
        elapsed_seconds: elapsed,
        rest_elapsed_seconds: restElapsedSeconds,
        rest_left_seconds: restLeft,
        started_at: startedAt || new Date().toISOString(),
        finished_at: workoutFinished ? new Date().toISOString() : null,
      }).catch(() => null);
    }, 5000);
    return () => clearInterval(timer);
  }, [
    authSession?.token,
    workoutId,
    currentSessionId,
    completedByExercise,
    weightOverrides,
    repsOverrides,
    elapsed,
    restElapsedSeconds,
    restLeft,
    startedAt,
    workoutFinished,
  ]);

  function startWorkout() {
    const started = startedAt || new Date().toISOString();
    setStartedAt(started);
    setWorkoutStarted(true);
    setWorkoutFinished(false);
    setPaused(false);
  }

  function handlePrimaryAction() {
    if (exerciseDone) {
      if (isLastExercise) {
        finishWorkout();
      } else {
        nextExercise();
      }
      return;
    }
    if (!workoutStarted) startWorkout();
    markSet();
  }

  function markSet() {
    const next = Math.min(activeExerciseSets.length, completedSets + 1);
    setCompletedByExercise((c) => ({ ...c, [exercise.id]: next }));
    const completedSet = activeExerciseSets[Math.max(0, next - 1)];
    const nextRest =
      next < activeExerciseSets.length
        ? completedSet?.restSeconds ?? exercise.restSeconds
        : 0;
    setRestTotal(nextRest);
    setRestLeft(nextRest);
    setRestElapsedSeconds(0);
    setSetEditor(null);
  }

  function nextExercise() {
    setCurrentIndex((v) => Math.min(sessionExercises.length - 1, v + 1));
    setRestLeft(0);
    setRestTotal(0);
    setHelpOpen(false);
    setSetEditor(null);
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ y: 0, animated: false }),
    );
  }

  function openExercise(index: number) {
    setCurrentIndex(index);
    setRestLeft(0);
    setRestTotal(0);
    setHelpOpen(false);
    setSetEditor(null);
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ y: 0, animated: false }),
    );
  }

  function getSetWeight(eId: string, sId: string, pw?: string) {
    return weightOverrides[weightKey(eId, sId)] ?? pw;
  }

  function getSetReps(eId: string, sId: string, pr: string) {
    return repsOverrides[repsKey(eId, sId)] ?? pr;
  }

  function openSetEditor(setIndex: number) {
    const set = activeExerciseSets[setIndex];
    if (!set) return;
    setRepsDraft(normalizeReps(getSetReps(exercise.id, set.id, set.reps)));
    setWeightDraft(parseWeight(getDisplayWeight(set, setIndex)).toString());
    setSetEditor({ exerciseIndex: currentIndex, setIndex });
  }

  function applySetExecution(
    scope: "single" | "exercise-next" | "workout-next",
  ) {
    if (!setEditor) return;
    const nw = weightDraft ? formatWeight(weightDraft) : "";
    const nr = repsDraft.trim();
    const nextWeightOverrides = { ...weightOverrides };
    const nextRepsOverrides = { ...repsOverrides };

    sessionExercises.forEach((item, ii) => {
      if (scope === "single" && ii !== setEditor.exerciseIndex) return;
      if (scope === "exercise-next" && ii !== setEditor.exerciseIndex) return;
      if (scope === "workout-next" && ii < setEditor.exerciseIndex) return;

      getExerciseSets(item).forEach((set, si) => {
        if (scope === "single" && si !== setEditor.setIndex) return;
        if (
          (scope === "exercise-next" || scope === "workout-next") &&
          ii === setEditor.exerciseIndex &&
          si < setEditor.setIndex
        ) {
          return;
        }

        if (nw) nextWeightOverrides[weightKey(item.id, set.id)] = nw;
        if (nr) nextRepsOverrides[repsKey(item.id, set.id)] = nr;
      });
    });

    setWeightOverrides(nextWeightOverrides);
    setRepsOverrides(nextRepsOverrides);

    if (authSession?.token) {
      void saveSessionProgress(authSession.token, workoutId, currentSessionId, {
        completed_sets: completedByExercise,
        weight_overrides: nextWeightOverrides,
        reps_overrides: nextRepsOverrides,
        elapsed_seconds: elapsed,
        rest_elapsed_seconds: restElapsedSeconds,
        rest_left_seconds: restLeft,
        started_at: startedAt || new Date().toISOString(),
        finished_at: workoutFinished ? new Date().toISOString() : null,
      }).catch(() => null);
    }

    setSetEditor(null);
  }

  function addSet() {
    const lastSet = activeExerciseSets[activeExerciseSets.length - 1];
    if (!lastSet) return;
    const newSet: WorkoutSet = {
      ...lastSet,
      id: `${lastSet.id}-extra-${Date.now()}`,
    };

    setSetsByExercise((current) => ({
      ...current,
      [exercise.id]: [...activeExerciseSets, newSet],
    }));
  }

  function finishWorkout() {
    setWorkoutFinished(true);
    setPaused(true);
    setRestLeft(0);
    setRestTotal(0);
    router.push(
        `/(app)/workouts/${workoutId}/finish?sessionId=${currentSessionId}&elapsed=${elapsed}&sets=${completedSetsTotal}&totalSets=${totalSets}&exercises=${completedExercisesTotal}&progressions=${progressionsTotal}` as Href,
    );
  }

  function confirmCloseWorkout() {
    if (!workoutStarted && completedSetsTotal === 0) {
      router.back();
      return;
    }
    setConfirmOpen(true);
  }

  function toggleTimer() {
    if (workoutFinished) return;
    if (!workoutStarted) {
      startWorkout();
      return;
    }
    setPaused((v) => !v);
  }

  const primaryActionLabel = exerciseDone
    ? isLastExercise
      ? "Finalizar treino"
      : "Próximo exercício"
    : "Marcar série";

  return (
    <View className="flex-1 bg-bg-base">
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View
          className="px-4 pb-3 pt-2 flex-row items-center gap-3"
          style={{
            borderBottomWidth: 1,
            borderBottomColor: isDark ? "#1A1A1A" : "#F0F0F0",
          }}
        >
          <Pressable
            accessibilityRole="button"
            className="h-[34px] w-[34px] items-center justify-center rounded-full bg-bg-surface border border-border-subtle"
            onPress={confirmCloseWorkout}
          >
            <X color={isDark ? "#9CA3AF" : "#6B7280"} size={14} weight="bold" />
          </Pressable>
          <View className="flex-1 items-center">
            <AppText className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
              {workoutFinished
                ? "Finalizado"
                : paused
                  ? "Pausado"
                  : workoutStarted
                    ? "Em andamento"
                    : "Pronto"}
            </AppText>
            <AppText
              className="mt-0.5 font-heading text-[14px] font-semibold text-text-main"
              style={{ letterSpacing: -0.3 }}
            >
              {sessionDisplayTitle}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            className="min-w-[84px] flex-row items-center justify-center gap-1.5 rounded-full px-3 py-1.5"
            onPress={toggleTimer}
            style={{
              backgroundColor: "#8B5CF6",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            {!workoutStarted || paused ? (
              <Play color="#FFFFFF" size={10} weight="fill" />
            ) : (
              <Pause color="#FFFFFF" size={10} weight="fill" />
            )}
            <AppText className="text-xs font-bold text-white">
              {formatSeconds(elapsed)}
            </AppText>
          </Pressable>
        </View>

        <View className="px-4 pb-2 pt-6">
          <View className="mb-1.5 flex-row items-center justify-between">
            <AppText className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              Ex {currentIndex + 1}/{sessionExercises.length} ·{" "}
              {completedSetsTotal}/{totalSets} séries
            </AppText>
            <AppText className="text-[10px] font-semibold text-text-muted">
              {Math.round(progressPercent)}%
            </AppText>
          </View>
          <View className="h-[3px] overflow-hidden rounded-full bg-bg-surface">
            <View
              className="h-full rounded-full"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: muscleAccent,
              }}
            />
          </View>
        </View>

        <View style={{ minHeight: 44, justifyContent: "center" }}>
          <ScrollView
            directionalLockEnabled
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            style={{ minHeight: 44, maxHeight: 44 }}
            contentContainerStyle={{
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: 8,
            }}
          >
            {sessionExercises.map((item, index) => {
              const allDone =
                (completedByExercise[item.id] ?? 0) >=
                getExerciseSets(item).length;
              const active = currentIndex === index;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() => openExercise(index)}
                  style={{
                    width: 34,
                    height: 28,
                    borderRadius: 999,
                    borderWidth: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    borderColor: active
                      ? muscleAccent
                      : isDark
                        ? "#222222"
                        : "#E5E5E5",
                    backgroundColor: active
                      ? `${muscleAccent}12`
                      : allDone
                        ? "rgba(34,197,94,0.08)"
                        : isDark
                          ? "#111111"
                          : "#F7F7F7",
                  }}
                >
                  <AppText
                    className="text-center text-[10px] font-bold"
                    style={{
                      color: active
                        ? muscleAccent
                        : allDone
                          ? "#22C55E"
                          : isDark
                            ? "#8A8A8A"
                            : "#6B7280",
                    }}
                  >
                    {allDone ? "✓" : index + 1}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          ref={scrollRef}
          alwaysBounceVertical={false}
          bounces
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 132 + Math.max(insets.bottom, 12),
          }}
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInDown.springify().damping(22).stiffness(180)}
          >
            <View className="justify-start">
              <View className="flex-1">
                {exercise.equipment && (
                  <View className="mb-3">
                    <AppText className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-secondary">
                      {exercise.equipment}
                    </AppText>
                  </View>
                )}
                <AppText
                  className="font-heading text-[22px] font-bold text-text-main"
                  style={{ letterSpacing: -0.35, lineHeight: 24 }}
                >
                  {exercise.name}
                </AppText>
                <AppText className="mt-2 text-[13px] text-text-muted">
                  {exercise.muscle} · Descanso {currentSetRestSeconds}s
                </AppText>
              </View>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.springify()
              .damping(22)
              .stiffness(180)
              .delay(50)}
          >
            <View className="mb-4 gap-2">
              <View className="pr-2">
                <AppText className="text-sm leading-6 text-text-muted">
                  {exerciseDescription ?? exercise.cue}
                </AppText>
              </View>
              <Pressable
                accessibilityRole="button"
                className="min-h-[44px] w-full flex-row items-center justify-center gap-2 rounded-xl border border-border-subtle bg-bg-surface px-3 py-2.5"
                onPress={() => setHelpOpen(true)}
              >
                <Question color="#A78BFA" size={14} weight="bold" />
                <AppText className="text-xs font-bold text-brand-secondary">
                  Ajuda
                </AppText>
              </Pressable>
            </View>

            {exercise.previous ? (
              <View className="mb-5 flex-row items-center gap-2 rounded-[10px] border border-border-subtle bg-bg-surface px-3 py-2.5">
                <Clock
                  color={isDark ? "#8A8A8A" : "#71717A"}
                  size={12}
                  weight="bold"
                />
                <AppText className="text-[11px] text-text-muted">
                  Última vez:
                </AppText>
                <AppText
                  className="flex-1 text-[11px] font-bold text-brand-secondary"
                  numberOfLines={1}
                >
                  {previousHeadline}
                </AppText>
                {previousVolume ? (
                  <AppText className="text-[10px] text-text-muted">
                    {previousVolume}
                  </AppText>
                ) : null}
              </View>
            ) : null}
          </Animated.View>

          <Animated.View
            entering={FadeInDown.springify()
              .damping(22)
              .stiffness(180)
              .delay(90)}
            onLayout={(e) => {
              seriesYRef.current = e.nativeEvent.layout.y;
            }}
          >
            <View className="mb-1 flex-row items-center justify-between border-b border-border-subtle pb-3">
              <AppText className="text-[11px] font-bold uppercase tracking-[0.25em] text-text-muted">
                Séries - {completedSets}/{activeExerciseSets.length} concluídas
              </AppText>
              {restRunning ? (
                <AppText className="text-xs font-bold text-brand-secondary">
                  {formatSeconds(restLeft)} descanso
                </AppText>
              ) : null}
            </View>

            <View
              onLayout={(e) => {
                seriesYRef.current = e.nativeEvent.layout.y;
              }}
            >
              {activeExerciseSets.map((set, index) => {
                const done = index < completedSets;
                const isNext = index === completedSets && !exerciseDone;
                const curReps = normalizeReps(
                  getSetReps(exercise.id, set.id, set.reps),
                );
                const curWeight = getDisplayWeight(set, index);
                const editing =
                  setEditor?.exerciseIndex === currentIndex &&
                  setEditor.setIndex === index;

                if (editing) {
                  return (
                    <View
                      key={set.id}
                      className="mb-1 flex-row items-center gap-2 rounded-xl border border-border-subtle bg-bg-surface px-3 py-3"
                    >
                      <View className="mr-3 h-[22px] w-[22px] items-center justify-center rounded-full bg-bg-elevated">
                        <AppText className="text-[9px] font-bold text-text-muted">
                          {index + 1}
                        </AppText>
                      </View>

                      <View className="flex-1 flex-row items-center justify-end gap-4">
                        <View className="flex-row items-center gap-1">
                          <Pressable
                            className="h-[28px] w-[28px] items-center justify-center rounded-[8px] border border-border-subtle bg-bg-elevated"
                            onPress={() =>
                              setWeightDraft((value) =>
                                String(
                                  Math.max(
                                    0,
                                    (parseFloat(value || "0") || 0) - 2.5,
                                  ),
                                ),
                              )
                            }
                          >
                            <Minus color="#9CA3AF" size={11} weight="bold" />
                          </Pressable>
                          <TextInput
                            className="h-[34px] w-[58px] rounded-[8px] border border-brand-primary bg-bg-elevated px-2 text-center text-sm font-bold text-white"
                            keyboardType="decimal-pad"
                            onChangeText={setWeightDraft}
                            style={{
                              lineHeight: 16,
                              paddingVertical: 0,
                              textAlignVertical: "center",
                            }}
                            value={weightDraft}
                          />
                          <Pressable
                            className="h-[28px] w-[28px] items-center justify-center rounded-[8px] border border-border-subtle bg-bg-elevated"
                            onPress={() =>
                              setWeightDraft((value) =>
                                String((parseFloat(value || "0") || 0) + 2.5),
                              )
                            }
                          >
                            <Plus color="#9CA3AF" size={11} weight="bold" />
                          </Pressable>
                          <AppText className="text-[11px] text-text-muted">
                            kg
                          </AppText>
                        </View>

                        <View className="flex-row items-center gap-1">
                          <Pressable
                            className="h-[28px] w-[28px] items-center justify-center rounded-[8px] border border-border-subtle bg-bg-elevated"
                            onPress={() =>
                              setRepsDraft((value) =>
                                String(
                                  Math.max(
                                    1,
                                    (parseInt(value || "1", 10) || 1) - 1,
                                  ),
                                ),
                              )
                            }
                          >
                            <Minus color="#9CA3AF" size={11} weight="bold" />
                          </Pressable>
                          <TextInput
                            className="h-[34px] w-[40px] rounded-[8px] border border-brand-primary bg-bg-elevated px-2 text-center text-sm font-bold text-white"
                            keyboardType="number-pad"
                            onChangeText={setRepsDraft}
                            style={{
                              lineHeight: 16,
                              paddingVertical: 0,
                              textAlignVertical: "center",
                            }}
                            value={repsDraft}
                          />
                          <Pressable
                            className="h-[28px] w-[28px] items-center justify-center rounded-[8px] border border-border-subtle bg-bg-elevated"
                            onPress={() =>
                              setRepsDraft((value) =>
                                String((parseInt(value || "0", 10) || 0) + 1),
                              )
                            }
                          >
                            <Plus color="#9CA3AF" size={11} weight="bold" />
                          </Pressable>
                          <AppText className="text-[11px] text-text-muted">
                            reps
                          </AppText>
                        </View>

                        <Pressable
                          className="min-w-[44px] rounded-[8px] bg-brand-primary px-3 py-2"
                          onPress={() => applySetExecution("single")}
                        >
                          <AppText className="text-[11px] font-bold text-white">
                            OK
                          </AppText>
                        </Pressable>
                      </View>
                    </View>
                  );
                }

                return (
                  <Pressable
                    key={set.id}
                    className={cn(
                      "flex-row items-center py-3.5",
                      isNext ? "px-3 -mx-3 rounded-xl" : undefined,
                    )}
                    style={[
                      !isNext
                        ? {
                            borderBottomWidth: 1,
                            borderBottomColor: isDark ? "#1A1A1A" : "#F0F0F0",
                          }
                        : {
                            backgroundColor: `${muscleAccent}09`,
                            marginBottom: 1,
                          },
                      done ? { opacity: 0.35 } : undefined,
                    ]}
                    onPress={() => {
                      if (!done) openSetEditor(index);
                    }}
                  >
                    <View
                      className="mr-3 h-[22px] w-[22px] items-center justify-center rounded-full"
                      style={{
                        backgroundColor: done
                          ? "#22C55E"
                          : isNext
                            ? "transparent"
                            : isDark
                              ? "#18181B"
                              : "#F4F4F5",
                        borderWidth: isNext ? 1.5 : 0,
                        borderColor: isNext ? muscleAccent : "transparent",
                      }}
                    >
                      {done ? (
                        <Check color="#FFFFFF" size={11} weight="bold" />
                      ) : (
                        <AppText
                          className="text-[9px] font-bold"
                          style={{
                            color: isNext
                              ? muscleAccent
                              : isDark
                                ? "#9CA3AF"
                                : "#6B7280",
                          }}
                        >
                          {index + 1}
                        </AppText>
                      )}
                    </View>

                    <AppText
                      className={cn(
                        "w-[96px] text-[14px] font-semibold",
                        done
                          ? "line-through text-text-muted"
                          : "text-text-main",
                      )}
                    >
                      {getSetLabel(set, index)}
                    </AppText>

                    <View className="ml-2 flex-1 flex-row items-center justify-end gap-3">
                      <AppText
                        className={cn(
                          "text-right text-[14px] font-semibold",
                          done ? "text-text-muted" : "text-text-main",
                        )}
                      >
                        {curWeight
                          ? `${curWeight} x ${curReps}`
                          : (set.duration ?? `${curReps} reps`)}
                      </AppText>
                      {!done ? (
                        <Pressable
                          className="h-[28px] w-[28px] items-center justify-center rounded-[8px] border border-border-subtle bg-bg-surface"
                          onPress={(event) => {
                            event.stopPropagation();
                            openSetEditor(index);
                          }}
                        >
                          <PencilSimple
                            color={isDark ? "#71717A" : "#9CA3AF"}
                            size={13}
                            weight="bold"
                          />
                        </Pressable>
                      ) : null}
                      {isNext ? (
                        <Pressable
                          className="h-[28px] min-w-[40px] items-center justify-center rounded-[8px] bg-brand-primary px-3"
                          onPress={(event) => {
                            event.stopPropagation();
                            markSet();
                          }}
                        >
                          <Check color="#FFFFFF" size={12} weight="bold" />
                        </Pressable>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              accessibilityRole="button"
              className="mt-3 flex-row items-center justify-center gap-2 rounded-[10px] border border-dashed border-border-subtle px-3 py-3"
              onPress={addSet}
            >
              <Plus
                color={isDark ? "#A1A1AA" : "#71717A"}
                size={12}
                weight="bold"
              />
              <AppText className="text-xs font-semibold text-text-muted">
                Adicionar série
              </AppText>
            </Pressable>
          </Animated.View>
        </ScrollView>

        <View
          className="absolute bottom-0 left-0 right-0 px-4 pt-3"
          style={{
            backgroundColor: isDark
              ? "rgba(0,0,0,0.95)"
              : "rgba(255,255,255,0.97)",
            borderTopWidth: 1,
            borderTopColor: isDark ? "#1A1A1A" : "#F0F0F0",
            paddingBottom: Math.max(insets.bottom, 12),
          }}
        >
          <View className="flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              className="h-[52px] w-[52px] items-center justify-center rounded-2xl bg-bg-surface border border-border-subtle"
              disabled={currentIndex === 0}
              onPress={() => setCurrentIndex((v) => Math.max(0, v - 1))}
              style={currentIndex === 0 ? { opacity: 0.4 } : undefined}
            >
              <CaretLeft
                color={isDark ? "#FFFFFF" : "#111827"}
                size={18}
                weight="bold"
              />
            </Pressable>
            <AppButton
              className="flex-1"
              leftIcon={
                exerciseDone && isLastExercise ? (
                  <CheckCircle size={16} color="#FFFFFF" weight="bold" />
                ) : !exerciseDone ? (
                  <Check size={15} color="#FFFFFF" weight="bold" />
                ) : undefined
              }
              rightIcon={
                exerciseDone && !isLastExercise ? (
                  <CaretRight size={14} color="#FFFFFF" weight="bold" />
                ) : undefined
              }
              onPress={handlePrimaryAction}
              variant="primary"
            >
              {primaryActionLabel}
            </AppButton>
          </View>
        </View>
      </SafeAreaView>

      <ExerciseHelpSheet
        exercise={{
          ...exercise,
          description: exerciseDescription,
          executionTips: exerciseExecutionTips,
        }}
        helpVideos={helpVideos}
        image={sessionImage}
        onClose={() => setHelpOpen(false)}
        title={sessionDisplayTitle}
        visible={helpOpen}
      />

      <RestOverlay
        accent={muscleAccent}
        onSkip={() => {
          setRestLeft(0);
          setRestTotal(0);
          setRestElapsedSeconds(0);
        }}
        seconds={restLeft}
        total={restTotal || currentSetRestSeconds}
        visible={restRunning}
      />

      <ExitWorkoutPrompt
        doneSets={completedSetsTotal}
        elapsed={elapsed}
        onClose={() => setConfirmOpen(false)}
        onExit={() => router.replace("/(app)/(tabs)/workouts")}
        onSaveAndExit={finishWorkout}
        onResume={() => setConfirmOpen(false)}
        totalSets={totalSets}
        visible={confirmOpen}
      />
    </View>
  );
}
