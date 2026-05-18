import {
  Barbell,
  Check,
  Clock,
  Flame,
  MagnifyingGlass,
  Play,
  X,
} from "phosphor-react-native";
import { router, type Href } from "expo-router";
import { Image } from "expo-image";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import * as Linking from "expo-linking";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyPlanState } from "@/src/shared/components/layout/EmptyPlanState";
import { PageHeader } from "@/src/shared/components/layout/PageHeader";
import { AppButton } from "@/src/shared/components/ui/AppButton";
import { AppText } from "@/src/shared/components/ui/AppText";
import { NotificationsModal } from "@/src/shared/components/ui/NotificationsModal";
import { resolveApiUrl } from "@/src/shared/api/apiClient";
import { useRefetchOnFocus } from "@/src/shared/hooks/useRefetchOnFocus";
import { useAppTheme } from "@/src/shared/theme/appTheme";
import { useAuthStore } from "@/src/features/auth/services/auth.store";

import {
  getCurrentWorkout,
  type WorkoutSessionDTO,
  type WorkoutSheetDTO,
} from "../api/workouts";
import {
  createEvaluation,
  getStudentEvaluations,
  type EvaluationDTO,
} from "../../assessments/api/assessments";
import { WorkoutNativeBottomSheet } from "../components/WorkoutNativeBottomSheet";

type WorkoutPreview = {
  sheet: WorkoutSheetDTO;
  session: WorkoutSessionDTO;
  image: any;
  label: string;
  progress: number;
  displayTitle: string;
  displayExercises: number;
  displayMinutes: number;
  displaySeriesCount: number;
};

type CurrentWorkoutData = Awaited<ReturnType<typeof getCurrentWorkout>>;

const WORKOUT_IMAGES = [
  require("@/assets/images/photoshoot/photoshoot-21.jpeg"),
  require("@/assets/images/photoshoot/photoshoot-31.jpeg"),
  require("@/assets/images/photoshoot/photoshoot-28.jpeg"),
  require("@/assets/images/photoshoot/photoshoot-17.jpeg"),
  require("@/assets/images/photoshoot/photoshoot-6.jpeg"),
  require("@/assets/images/photoshoot/photoshoot-29.jpeg"),
  require("@/assets/images/photoshoot/photoshoot-24.jpeg"),
  require("@/assets/images/photoshoot/photoshoot-30.jpeg"),
];

const COLD_DAY_ICON = require("@/assets/images/cold_icon.png");

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

const WEEK_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];
const WEEK_DAY_NAMES = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

function isGenericWorkoutTitle(title: string) {
  const normalized = title.trim().toLowerCase();
  return (
    normalized.startsWith("treino") || normalized.startsWith("cima e baixo")
  );
}

function getDisplayTitle(session: WorkoutSessionDTO, index: number) {
  if (!isGenericWorkoutTitle(session.title)) return session.title;

  if (session.muscles?.length) {
    const visibleMuscles = session.muscles
      .slice(0, 2)
      .map((muscle) => MUSCLE_LABELS[muscle] ?? muscle);
    if (visibleMuscles.length === 2)
      return `${visibleMuscles[0]} e ${visibleMuscles[1]}`;
    if (visibleMuscles.length === 1) return visibleMuscles[0];
  }

  return `Treino ${String.fromCharCode(65 + index)}`;
}

function getWorkoutDayIndex(day: string) {
  return WEEK_DAY_NAMES.findIndex((item) => item === day);
}

function resolveWorkoutCardImage(session: WorkoutSessionDTO, index: number) {
  const coverUrl = session.exercises[0]?.coverUrl;
  const resolvedCoverUrl = resolveApiUrl(coverUrl);
  return resolvedCoverUrl ? { uri: resolvedCoverUrl } : WORKOUT_IMAGES[index % WORKOUT_IMAGES.length];
}

function isSessionCompleted(
  data: CurrentWorkoutData | undefined,
  session: WorkoutSessionDTO,
) {
  return getProgress(data, session.id) >= getTotalSets(session) && getTotalSets(session) > 0;
}

function StreakStrip({
  items,
  completedCount,
}: {
  items: Array<{ label: string; state: "done" | "today" | "scheduled" | "frozen" }>;
  completedCount: number;
}) {

  return (
    <View
      style={{
        marginBottom: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#222222",
        backgroundColor: "#111111",
        paddingHorizontal: 14,
        paddingVertical: 12,
      }}
    >
      <AppText className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
        Sequência desta semana
      </AppText>
      <View className="flex-row items-center">
        <View className="flex-row items-center gap-2">
          {items.map((day, index) => {
            const isDone = day.state === "done";
            const isToday = day.state === "today";
            const isScheduled = day.state === "scheduled";
            const isFrozen = day.state === "frozen";

            return (
              <View key={`${day.label}-${index}`} className="items-center gap-1">
                <AppText
                  style={{
                    fontSize: 9,
                    fontWeight: isToday ? "700" : "500",
                    color: isToday ? "#8B5CF6" : isScheduled ? "#A78BFA" : "#777777",
                  }}
                >
                  {day.label}
                </AppText>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 99,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isToday
                      ? "#8B5CF6"
                      : isDone
                        ? "rgba(139,92,246,0.20)"
                        : isScheduled
                          ? "rgba(139,92,246,0.08)"
                          : "#181818",
                    borderWidth: 1,
                    borderColor: isToday
                      ? "#8B5CF6"
                      : isDone
                        ? "rgba(139,92,246,0.24)"
                        : isScheduled
                          ? "rgba(139,92,246,0.28)"
                          : "#262626",
                  }}
                >
                  {isDone ? (
                    <Check size={10} color="#A78BFA" weight="bold" />
                  ) : isToday ? (
                    <View
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 99,
                        backgroundColor: "#FFFFFF",
                      }}
                    />
                  ) : isFrozen ? (
                    <Image
                      source={COLD_DAY_ICON}
                      contentFit="contain"
                      style={{ width: 14, height: 14 }}
                    />
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
        <View className="flex-1" />
        <View
          className="flex-row items-center gap-1.5 rounded-full px-3 py-1"
          style={{ backgroundColor: "rgba(251,191,36,0.10)" }}
        >
          <Flame size={12} color="#FBBF24" weight="fill" />
          <AppText
            className="text-[11px] font-bold"
            style={{ color: "#FBBF24" }}
          >
            {completedCount} dias
          </AppText>
        </View>
      </View>
    </View>
  );
}

function ImageScrim() {
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <Defs>
        <SvgLinearGradient id="verticalScrim" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#000000" stopOpacity="0.02" />
          <Stop offset="0.24" stopColor="#000000" stopOpacity="0.06" />
          <Stop offset="0.54" stopColor="#000000" stopOpacity="0.28" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0.74" />
        </SvgLinearGradient>
        <SvgLinearGradient id="horizontalScrim" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#000000" stopOpacity="0.28" />
          <Stop offset="0.48" stopColor="#000000" stopOpacity="0.06" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0.14" />
        </SvgLinearGradient>
        <SvgLinearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#08080A" stopOpacity="0" />
          <Stop offset="0.30" stopColor="#08080A" stopOpacity="0.16" />
          <Stop offset="0.66" stopColor="#08080A" stopOpacity="0.48" />
          <Stop offset="1" stopColor="#08080A" stopOpacity="0.82" />
        </SvgLinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#verticalScrim)" />
      <Rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="url(#horizontalScrim)"
      />
      <Rect x="0" y="28%" width="100%" height="72%" fill="url(#bottomFade)" />
    </Svg>
  );
}

function DrawerHeaderScrim() {
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <Defs>
        <SvgLinearGradient id="drawerHeaderMain" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#000000" stopOpacity="0.04" />
          <Stop offset="0.42" stopColor="#000000" stopOpacity="0.22" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0.84" />
        </SvgLinearGradient>
        <SvgLinearGradient id="drawerHeaderBottom" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#08080A" stopOpacity="0" />
          <Stop offset="0.30" stopColor="#08080A" stopOpacity="0.20" />
          <Stop offset="0.68" stopColor="#08080A" stopOpacity="0.56" />
          <Stop offset="1" stopColor="#08080A" stopOpacity="0.86" />
        </SvgLinearGradient>
      </Defs>
      <Rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="url(#drawerHeaderMain)"
      />
      <Rect
        x="0"
        y="28%"
        width="100%"
        height="72%"
        fill="url(#drawerHeaderBottom)"
      />
    </Svg>
  );
}

function CardLight() {
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <Defs>
        <RadialGradient id="topRightLight" cx="92%" cy="8%" rx="52%" ry="48%">
          <Stop offset="0" stopColor="#A78BFA" stopOpacity="0.18" />
          <Stop offset="0.36" stopColor="#8B5CF6" stopOpacity="0.08" />
          <Stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="bottomLeftLight" cx="6%" cy="96%" rx="40%" ry="36%">
          <Stop offset="0" stopColor="#8B5CF6" stopOpacity="0.12" />
          <Stop offset="0.44" stopColor="#8B5CF6" stopOpacity="0.05" />
          <Stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#topRightLight)" />
      <Rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="url(#bottomLeftLight)"
      />
    </Svg>
  );
}

function getProgress(data: CurrentWorkoutData | undefined, sessionId: string) {
  const progress = data?.progressBySession?.[sessionId];
  if (!progress?.completed_sets) return 0;
  const total = Object.values(progress.completed_sets).reduce(
    (sum: number, value) => sum + Number(value || 0),
    0,
  );
  return total;
}

function getTotalSets(session: WorkoutSessionDTO) {
  return session.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.length,
    0,
  );
}

function NativeWorkoutSheet({
  preview,
  visible,
  onClose,
  onStart,
}: {
  preview: WorkoutPreview | null;
  visible: boolean;
  onClose: () => void;
  onStart: () => void;
}) {
  if (!preview) return null;

  return (
    <WorkoutNativeBottomSheet
      visible={visible}
      onVisibleChange={(next) => !next && onClose()}
    >
      <WorkoutOverviewContent
        preview={preview}
        onClose={onClose}
        onStart={onStart}
      />
    </WorkoutNativeBottomSheet>
  );
}

function WorkoutOverviewContent({
  preview,
  onClose,
  onStart,
}: {
  preview: WorkoutPreview;
  onClose: () => void;
  onStart: () => void;
}) {
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const {
    session,
    image,
    label,
    displayTitle,
    displayExercises,
    displayMinutes,
    displaySeriesCount,
  } = preview;
  const muscles = [
    ...new Set(session.exercises.map((exercise) => exercise.muscle)),
  ].slice(0, 4);

  return (
    <View
      style={{
        backgroundColor: isDark ? "#090909" : "#FFFFFF",
        maxHeight: "100%",
      }}
    >
      <View
        style={{
          height: 226,
          overflow: "hidden",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.10)",
        }}
      >
        <Image
          source={image}
          contentFit="cover"
          contentPosition="center"
          style={StyleSheet.absoluteFillObject}
        />
        <DrawerHeaderScrim />
        <View style={{ position: "absolute", left: 20, right: 20, bottom: 16 }}>
          <View className="mb-2 flex-row gap-2">
            <View
              style={{
                borderRadius: 999,
                backgroundColor: "rgba(18,12,28,0.42)",
                borderWidth: 1,
                borderColor: "rgba(139,92,246,0.34)",
                paddingHorizontal: 9,
                paddingVertical: 3,
              }}
            >
              <AppText className="text-[9px] font-bold uppercase tracking-[0.12em] text-brand-secondary">
                {label}
              </AppText>
            </View>
            <View
              style={{
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.10)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
                paddingHorizontal: 9,
                paddingVertical: 3,
              }}
            >
              <AppText className="text-[9px] font-bold uppercase tracking-[0.08em] text-white/75">
                {preview.sheet.level}
              </AppText>
            </View>
          </View>
          <AppText
            className="font-heading text-[30px] font-bold text-white"
            style={{ letterSpacing: -0.5 }}
          >
            {displayTitle}
          </AppText>
          <View className="mt-1 flex-row flex-wrap items-center gap-x-3 gap-y-1">
            <AppText className="text-xs font-medium text-white/55">
              {displayExercises} exercícios
            </AppText>
            <AppText className="text-xs font-medium text-white/55">
              ~{displayMinutes} min
            </AppText>
            <AppText className="text-xs font-medium text-white/55">
              {displaySeriesCount} séries
            </AppText>
          </View>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {muscles.map((muscle) => (
              <View
                key={muscle}
                style={{
                  borderRadius: 999,
                  backgroundColor: "rgba(139,92,246,0.14)",
                  borderWidth: 1,
                  borderColor: "rgba(139,92,246,0.20)",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                <AppText className="text-[9px] font-bold uppercase tracking-[0.08em] text-brand-secondary">
                  {muscle}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={{ flexShrink: 1, minHeight: 0 }}>
        <ScrollView
          bounces={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: 6,
          }}
          showsVerticalScrollIndicator={false}
        >
          <AppText className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
            Exercícios
          </AppText>
          {session.exercises.slice(0, 8).map((exercise, index) => (
            <View
              key={exercise.id}
              className="flex-row items-center gap-3 py-3"
              style={
                index < Math.min(8, session.exercises.length) - 1
                  ? {
                      borderBottomWidth: 1,
                      borderBottomColor: isDark ? "#1A1A1A" : "#ECECEC",
                    }
                  : undefined
              }
            >
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(139,92,246,0.12)",
                  borderWidth: 1,
                  borderColor: "rgba(139,92,246,0.18)",
                }}
              >
                <AppText className="text-[11px] font-bold text-brand-secondary">
                  {index + 1}
                </AppText>
              </View>
              <AppText
                className="flex-1 text-sm font-semibold text-text-main"
                numberOfLines={1}
              >
                {exercise.name}
              </AppText>
              <AppText className="text-[11px] text-text-muted">
                {exercise.sets.length} séries
              </AppText>
            </View>
          ))}
          <View className="h-2" />
        </ScrollView>
      </View>

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: isDark ? "#1A1A1A" : "#ECECEC",
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 12),
        }}
      >
        <View className="flex-row gap-3">
          <AppButton
            className="w-[52px] px-0"
            onPress={onClose}
            size="md"
            variant="secondary"
          >
            <X size={18} color={isDark ? "#FFFFFF" : "#111111"} weight="bold" />
          </AppButton>
          <AppButton
            className="flex-1"
            leftIcon={<Play size={16} color="#FFFFFF" weight="fill" />}
            onPress={onStart}
            variant="primary"
          >
            Começar treino
          </AppButton>
        </View>
      </View>
    </View>
  );
}

function WorkoutPhotoCard({
  item,
  featured,
  onPress,
}: {
  item: WorkoutPreview;
  featured?: boolean;
  onPress: () => void;
}) {
  const {
    session,
    image,
    label,
    progress,
    displayTitle,
    displayExercises,
    displayMinutes,
    displaySeriesCount,
  } = item;
  const totalSets = session.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.length,
    0,
  );
  const pct =
    totalSets > 0 ? Math.min(100, Math.round((progress / totalSets) * 100)) : 0;
  const radius = featured ? 24 : 18;
  const aspectRatio = featured ? 334 / 210 : 334 / 164;
  const isDone = pct >= 100;

  return (
    <View
      style={{
        borderRadius: radius,
        width: "100%",
        shadowColor: "#000000",
        shadowOpacity: 0.46,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
      }}
    >
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => ({
          borderRadius: radius,
          width: "100%",
          aspectRatio,
          minHeight: featured ? 210 : 164,
          overflow: "hidden",
          backgroundColor: "#060606",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.18)",
          transform: [{ scale: pressed ? 0.985 : 1 }],
        })}
      >
        <ImageBackground
          source={image}
          resizeMode="cover"
          imageStyle={{ borderRadius: radius }}
          style={{ flex: 1, width: "100%" }}
        >
          <ImageScrim />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              inset: 0,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
              borderRadius: radius,
            }}
          />

          <View
            style={{
              flex: 1,
              justifyContent: "space-between",
              paddingHorizontal: featured ? 20 : 16,
              paddingTop: featured ? 20 : 16,
              paddingBottom: featured ? 22 : 18,
            }}
          >
            <View className="flex-row items-start justify-between">
              <View
                style={{
                  borderRadius: 99,
                  backgroundColor: "rgba(10,10,12,0.38)",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderWidth: 1,
                  borderColor: "rgba(139,92,246,0.28)",
                }}
              >
                <AppText className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-secondary">
                  {label}
                </AppText>
              </View>
              {isDone ? (
                <View
                  style={{
                    borderRadius: 99,
                    backgroundColor: "rgba(8,12,10,0.42)",
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    borderWidth: 1,
                    borderColor: "rgba(34,197,94,0.24)",
                  }}
                >
                  <AppText
                    style={{ fontSize: 9, fontWeight: "700", color: "#22C55E" }}
                  >
                    CONCLUÍDO
                  </AppText>
                </View>
              ) : null}
            </View>

            <View>
              {pct > 0 && pct < 100 ? (
                <View style={{ marginBottom: 8 }}>
                  <View className="mb-1 h-[3px] overflow-hidden rounded-full bg-white/20">
                    <View
                      className="h-full rounded-full bg-brand-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </View>
                  <AppText
                    style={{ fontSize: 9, fontWeight: "700", color: "#A78BFA" }}
                  >
                    {pct}% CONCLUÍDO
                  </AppText>
                </View>
              ) : null}

              <AppText
                className={
                  featured
                    ? "font-heading text-[21px] font-bold text-white"
                    : "font-heading text-[17px] font-bold text-white"
                }
                numberOfLines={2}
                style={{
                  lineHeight: featured ? 23 : 19,
                  letterSpacing: -0.3,
                  textShadowColor: "rgba(0,0,0,0.72)",
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 18,
                  marginBottom: 6,
                }}
              >
                {displayTitle}
              </AppText>

              <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
                <View className="flex-row items-center gap-1">
                  <Barbell size={10} color="#8B5CF6" weight="bold" />
                  <AppText className="text-[11px] font-medium text-white/60">
                    {displayExercises} ex
                  </AppText>
                </View>
                <View className="flex-row items-center gap-1">
                  <Clock size={10} color="#8B5CF6" weight="bold" />
                  <AppText className="text-[11px] font-medium text-white/60">
                    {displayMinutes} min
                  </AppText>
                </View>
                <View className="flex-row items-center gap-1">
                  <Flame size={10} color="#8B5CF6" weight="fill" />
                  <AppText className="text-[11px] font-medium text-white/60">
                    {displaySeriesCount} séries
                  </AppText>
                </View>
              </View>
            </View>
          </View>
        </ImageBackground>
      </Pressable>
    </View>
  );
}

export function WorkoutSheetsScreen() {
  const { isDark } = useAppTheme();
  const { session } = useAuthStore();
  const [isCreating, setIsCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<WorkoutPreview | null>(null);
  const [notifVisible, setNotifVisible] = useState(false);

  const { data: evaluations, refetch: refetchEvaluations } = useQuery({
    queryKey: ["assessments"],
    queryFn: () => getStudentEvaluations(session?.token!),
    enabled: !!session?.token,
  });
  const { data, isLoading, refetch: refetchWorkout } = useQuery({
    queryKey: ["student-workout-current"],
    queryFn: () => getCurrentWorkout(session?.token!),
    enabled: !!session?.token,
  });
  useRefetchOnFocus(refetchEvaluations, Boolean(session?.token));
  useRefetchOnFocus(refetchWorkout, Boolean(session?.token));

  const primarySheet = data?.workout ?? null;
  const hasWorkoutAccess = data?.hasAccess !== false;
  const workoutUpgradeUrl = data?.whatsappUpgradeUrl;
  const todaySession =
    primarySheet?.sessions.find((s) => s.id === data?.todaySessionId) || null;
  const hasWorkout = Boolean(primarySheet?.sessions.length);
  const questionnaire = session?.released_questionnaire;
  const hasSubmittedEvaluation = evaluations?.some(
    (ev: EvaluationDTO) =>
      (ev.questionnaire.id === questionnaire?.id ||
        (ev.questionnaire as any)._id === questionnaire?.id) &&
      ["answered", "analysis", "done"].includes(ev.status),
  );
  const showQuestionnaire = Boolean(questionnaire && !hasSubmittedEvaluation);

  const workoutItems = useMemo<WorkoutPreview[]>(() => {
    if (!primarySheet) return [];
    return primarySheet.sessions.map((workoutSession, index) => {
      const rawExerciseCount = workoutSession.exercises?.length ?? 0;
      const rawSeriesCount = workoutSession.exercises.reduce(
        (sum, exercise) =>
          sum +
          exercise.sets.filter(
            (set) =>
              set.type !== "warmup" &&
              set.type !== "preparatory" &&
              set.label !== "Aquecimento" &&
              set.label !== "Preparatória",
          ).length,
        0,
      );
      return {
        sheet: primarySheet,
        session: workoutSession,
        image: resolveWorkoutCardImage(workoutSession, index),
        label: `Treino ${String.fromCharCode(65 + index)}`,
        progress: getProgress(data, workoutSession.id),
        displayTitle: getDisplayTitle(workoutSession, index),
        displayExercises: rawExerciseCount,
        displayMinutes: workoutSession.estimatedMinutes,
        displaySeriesCount: rawSeriesCount,
      };
    });
  }, [data, primarySheet]);

  const nextWorkout = useMemo(() => {
    if (!workoutItems.length) return null;

    const todayIndex = new Date().getDay();
    const todayItem = todaySession
      ? workoutItems.find((item) => item.session.id === todaySession.id) ?? null
      : null;

    if (todayItem && !isSessionCompleted(data, todayItem.session)) {
      return todayItem;
    }

    for (let offset = 1; offset <= 7; offset += 1) {
      const lookupDay = (todayIndex + offset) % 7;
      const upcoming = workoutItems.find(
        (item) => getWorkoutDayIndex(item.session.days) === lookupDay,
      );
      if (upcoming) return upcoming;
    }

    return todayItem ?? workoutItems[0] ?? null;
  }, [data, todaySession, workoutItems]);

  const weekSequence = useMemo(() => {
    const scheduledByDay = new Map<number, WorkoutPreview>();
    workoutItems.forEach((item) => {
      const dayIndex = getWorkoutDayIndex(item.session.days);
      if (dayIndex >= 0 && !scheduledByDay.has(dayIndex)) {
        scheduledByDay.set(dayIndex, item);
      }
    });

    return WEEK_DAY_NAMES.map((_, index) => {
      const preview = scheduledByDay.get(index);
      if (!preview) {
        return { label: WEEK_LABELS[index], state: "frozen" as const };
      }

      if (index === new Date().getDay() && !isSessionCompleted(data, preview.session)) {
        return { label: WEEK_LABELS[index], state: "today" as const };
      }

      return {
        label: WEEK_LABELS[index],
        state: isSessionCompleted(data, preview.session) ? ("done" as const) : ("scheduled" as const),
      };
    });
  }, [data, workoutItems]);

  const completedWeekCount = useMemo(
    () => weekSequence.filter((item) => item.state === "done").length,
    [weekSequence],
  );

  const filteredWorkouts = workoutItems.filter((item) => {
    if (item.session.id === nextWorkout?.session.id && !query) return false;
    const search = query.trim().toLowerCase();
    const searchMatch =
      !search ||
      item.session.title.toLowerCase().includes(search) ||
      item.session.type.toLowerCase().includes(search) ||
      item.session.exercises.some((exercise) =>
        exercise.name.toLowerCase().includes(search),
      );
    return searchMatch;
  });

  const handleStartAssessment = async () => {
    if (!session?.token || !session?.released_questionnaire?.id) return;
    try {
      setIsCreating(true);
      const evalData = await createEvaluation(
        session.token,
        session.released_questionnaire.id,
      );
      router.push(`/(app)/assessments/${evalData.id}` as Href);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  const startWorkout = (item: WorkoutPreview) => {
    setPreview(null);
    router.push(
      `/(app)/workouts/${item.sheet.id}/session?sessionId=${item.session.id}` as Href,
    );
  };

  if (!isLoading && !hasWorkoutAccess) {
    return (
      <EmptyPlanState
        eyebrow="Acesso restrito"
        title="Seu plano não inclui treinos"
        subtitle="Para liberar esta aba, faça upgrade do seu plano com nossa equipe pelo WhatsApp."
        action={
          workoutUpgradeUrl
            ? {
                label: "Falar com a equipe",
                onPress: () => Linking.openURL(workoutUpgradeUrl),
              }
            : null
        }
      />
    );
  }

  if (!isLoading && !hasWorkout) {
    if (showQuestionnaire) {
      return (
        <EmptyPlanState
          eyebrow="Ação necessária"
          title="Responda a avaliação"
          subtitle="Antes de montar seu treino, nossa equipe precisa das suas respostas para personalizar tudo do jeito certo."
          action={{
            label: isCreating ? "Carregando..." : "Responder agora",
            onPress: handleStartAssessment,
          }}
        />
      );
    }

    return (
      <EmptyPlanState
        eyebrow="Em preparação"
        title="Seu treino está sendo montado"
        subtitle="Nossa equipe está elaborando seu plano personalizado. Ele aparecerá aqui assim que estiver pronto."
      />
    );
  }

  if (!hasWorkout) {
    return (
      <EmptyPlanState
        eyebrow="Carregando"
        title="Buscando seu treino..."
        subtitle="Aguarde um momento."
      />
    );
  }

  return (
    <>
      <View className="flex-1 bg-bg-base">
        <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
          <PageHeader
            title="Treinos"
            subtitle="Sua semana de performance"
            onNotificationPress={() => setNotifVisible(true)}
          />

          <ScrollView
            alwaysBounceVertical={false}
            bounces
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 8,
              paddingBottom: 140,
            }}
            keyboardShouldPersistTaps="handled"
            overScrollMode="never"
            showsVerticalScrollIndicator={false}
          >
            <StreakStrip items={weekSequence} completedCount={completedWeekCount} />

            <View className="mb-6">
              <View className="mb-3 flex-row items-end justify-between">
                <AppText className="text-[11px] font-bold uppercase tracking-[0.25em] text-text-muted">
                  Próximo treino
                </AppText>
                <AppText className="text-xs text-text-muted">
                  {nextWorkout?.session.days ?? todaySession?.days}
                </AppText>
              </View>
              {nextWorkout ? (
                <WorkoutPhotoCard
                  item={nextWorkout}
                  featured
                  onPress={() => setPreview(nextWorkout)}
                />
              ) : (
                <View
                  style={{
                    width: "100%",
                    aspectRatio: 334 / 210,
                    minHeight: 210,
                    borderRadius: 24,
                    backgroundColor: "#111111",
                  }}
                />
              )}
            </View>

            <View className="mb-5">
              <View
                className="mb-3 flex-row items-center rounded-2xl bg-bg-surface border border-border-subtle px-4"
                style={{ height: 50 }}
              >
                <MagnifyingGlass
                  size={17}
                  color={isDark ? "#666666" : "#888888"}
                  weight="bold"
                />
                <TextInput
                  className="ml-3 flex-1 text-text-main"
                  cursorColor="#8B5CF6"
                  onChangeText={setQuery}
                  placeholder="Buscar treino ou exercício"
                  placeholderTextColor={isDark ? "#666666" : "#999999"}
                  style={{
                    fontSize: 15,
                    height: 48,
                    lineHeight: 20,
                    paddingTop: 0,
                    paddingBottom: 0,
                    textAlignVertical: "center",
                  }}
                  value={query}
                />
              </View>
            </View>

            <View>
              <View className="mb-3 flex-row items-end justify-between border-b border-border-subtle pb-3">
                <AppText className="text-[11px] font-bold uppercase tracking-[0.25em] text-text-muted">
                  {query ? "Resultados" : "Todos os treinos"}
                </AppText>
                <AppText className="text-xs text-text-muted">
                  {filteredWorkouts.length} disponíveis
                </AppText>
              </View>

              <View style={{ gap: 12 }}>
                {filteredWorkouts.map((item) => (
                  <WorkoutPhotoCard
                    key={item.session.id}
                    item={item}
                    onPress={() => setPreview(item)}
                  />
                ))}
              </View>

              {filteredWorkouts.length === 0 ? (
                <View className="items-center py-12">
                  <AppText className="text-center text-sm text-text-muted">
                    Nenhum treino encontrado para essa busca.
                  </AppText>
                </View>
              ) : null}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>

      <NativeWorkoutSheet
        preview={preview}
        visible={Boolean(preview)}
        onClose={() => setPreview(null)}
        onStart={() => preview && startWorkout(preview)}
      />

      <NotificationsModal visible={notifVisible} onClose={() => setNotifVisible(false)} />
    </>
  );
}
