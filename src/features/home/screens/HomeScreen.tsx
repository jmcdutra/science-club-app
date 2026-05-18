import {
  ArrowRight,
  Barbell,
  Drop,
  ForkKnife,
  Play,
  Timer,
} from "phosphor-react-native";
import { router, type Href } from "expo-router";
import {
  type ImageSourcePropType,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

import { AppText } from "@/src/shared/components/ui/AppText";
import { AppLottie } from "@/src/shared/components/ui/AppLottie";
import { NotificationsModal } from "@/src/shared/components/ui/NotificationsModal";
import { PageHeader } from "@/src/shared/components/layout/PageHeader";
import { resolveApiUrl } from "@/src/shared/api/apiClient";
import { useRefetchOnFocus } from "@/src/shared/hooks/useRefetchOnFocus";
import { useAuthStore } from "@/src/features/auth/services/auth.store";
import {
  createEvaluation,
  getStudentEvaluations,
  type EvaluationDTO,
} from "../../assessments/api/assessments";
import { getCurrentWorkout } from "../../workouts/api/workouts";
import { getCurrentDiet } from "../../diet/api/diet";

/* ─── Constants ─────────────────────────────────────────────────────────── */

const WEEK_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];
const WORKOUT_HERO_IMAGE = require("@/assets/images/photoshoot/photoshoot-21.jpeg");

function ImageScrim() {
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <Defs>
        <SvgLinearGradient id="homeVerticalScrim" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#000000" stopOpacity="0.28" />
          <Stop offset="0.30" stopColor="#000000" stopOpacity="0.08" />
          <Stop offset="0.58" stopColor="#000000" stopOpacity="0.20" />
          <Stop offset="0.78" stopColor="#000000" stopOpacity="0.66" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0.96" />
        </SvgLinearGradient>
        <RadialGradient
          id="homeEdgeVignette"
          cx="50%"
          cy="45%"
          rx="78%"
          ry="68%"
        >
          <Stop offset="0" stopColor="#000000" stopOpacity="0" />
          <Stop offset="0.62" stopColor="#000000" stopOpacity="0.14" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0.76" />
        </RadialGradient>
      </Defs>
      <Rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="url(#homeVerticalScrim)"
      />
      <Rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="url(#homeEdgeVignette)"
      />
    </Svg>
  );
}

/* ─── Week Progress Strip ────────────────────────────────────────────────── */

function WeekStrip() {
  const days = useMemo(() => {
    const today = new Date();
    const dow = today.getDay();
    return WEEK_LABELS.map((label, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - dow + i);
      return { label, date: d.getDate(), isToday: i === dow, isPast: i < dow };
    });
  }, []);

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 24,
        marginBottom: 24,
      }}
    >
      {days.map((day, i) => (
        <View key={i} style={{ alignItems: "center", gap: 8 }}>
          {/* Day label */}
          <AppText
            style={{
              fontSize: 11,
              fontWeight: day.isToday ? "600" : "500",
              color: day.isToday ? "#8B5CF6" : "#666666",
            }}
          >
            {day.label}
          </AppText>

          {/* Today: pill with double-ring */}
          {day.isToday ? (
            <View
              style={{
                borderRadius: 99,
                borderWidth: 2,
                borderColor: "#8B5CF6",
                padding: 2,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 99,
                  backgroundColor: "#8B5CF6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppText
                  style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}
                >
                  {day.date}
                </AppText>
              </View>
            </View>
          ) : (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 99,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: day.isPast
                  ? "rgba(139,92,246,0.20)"
                  : "#111111",
                borderWidth: day.isPast ? 0 : 1,
                borderColor: "#222222",
              }}
            >
              <AppText
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: day.isPast ? "#8B5CF6" : "#666666",
                }}
              >
                {day.date}
              </AppText>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

/* ─── Hero Workout Card ──────────────────────────────────────────────────── */

type HeroCardProps = {
  sessionTitle: string;
  subtitle: string;
  metaText: string;
  buttonLabel: string;
  imageSource: ImageSourcePropType;
  actionEnabled: boolean;
  onStart: () => void;
};

function HomeActionButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}) {
  const contentColor = disabled ? "#888888" : "#FFFFFF";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        width: "100%",
        minHeight: 52,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "transparent",
        backgroundColor: disabled ? "#1A1A1A" : "#8B5CF6",
        opacity: disabled || loading ? 0.55 : 1,
        transform: [{ scale: pressed && !disabled && !loading ? 0.98 : 1 }],
        paddingHorizontal: 16,
        paddingVertical: 14,
        shadowColor: disabled ? "transparent" : "#8B5CF6",
        shadowOpacity: disabled ? 0 : 0.3,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: disabled ? 0 : 6,
      })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <View
          style={{
            width: 20,
            alignItems: "center",
            justifyContent: "center",
            opacity: leftIcon ? 1 : 0,
          }}
        >
          {leftIcon ?? <View />}
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 }}>
          <AppText
            style={{
              color: contentColor,
              fontWeight: "600",
              fontSize: 15,
              textAlign: "center",
            }}
          >
            {loading ? "Carregando..." : label}
          </AppText>
        </View>
        <View
          style={{
            width: 20,
            alignItems: "center",
            justifyContent: "center",
            opacity: rightIcon ? 1 : 0,
          }}
        >
          {rightIcon ?? <View />}
        </View>
      </View>
    </Pressable>
  );
}

function HeroWorkoutCard({
  sessionTitle,
  subtitle,
  metaText,
  buttonLabel,
  imageSource,
  actionEnabled,
  onStart,
}: HeroCardProps) {
  return (
    <View
      style={{
        marginHorizontal: 24,
        marginBottom: 12,
        borderRadius: 24,
        overflow: "hidden",
        height: 204,
        backgroundColor: "#111111",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <ImageBackground
        source={imageSource}
        resizeMode="cover"
        imageStyle={{ borderRadius: 24 }}
        style={{ flex: 1, width: "100%" }}
      >
        <ImageScrim />

        <View style={{ flex: 1, justifyContent: "space-between", padding: 18 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                borderRadius: 99,
                backgroundColor: "rgba(0,0,0,0.42)",
                paddingHorizontal: 10,
                paddingVertical: 5,
              }}
            >
              <Timer size={13} color="rgba(255,255,255,0.78)" />
              <AppText
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.78)",
                  fontWeight: "600",
                }}
              >
                {metaText}
              </AppText>
            </View>
          </View>

          <View>
            <AppText
              className="font-heading"
              style={{
                fontSize: 24,
                fontWeight: "700",
                letterSpacing: -0.5,
                lineHeight: 28,
                marginBottom: 4,
                color: "#FFFFFF",
              }}
            >
              {sessionTitle}
            </AppText>

            <AppText
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.72)",
                marginBottom: 14,
              }}
            >
              {subtitle}
            </AppText>

            <HomeActionButton
              label={buttonLabel}
              onPress={onStart}
              disabled={!actionEnabled}
              leftIcon={
                <Play
                  size={16}
                  color={actionEnabled ? "#fff" : "#888888"}
                  weight="fill"
                />
              }
            />
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

/* ─── Assessment Pending Card ───────────────────────────────────────────── */

type AssessmentPendingCardProps = {
  onPress: () => void;
  loading: boolean;
};

function AssessmentPendingCard({
  onPress,
  loading,
}: AssessmentPendingCardProps) {
  return (
    <View
      style={{
        marginHorizontal: 24,
        marginTop: 20,
        marginBottom: 12,
        paddingHorizontal: 4,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          marginBottom: 18,
        }}
      >
        <View
          style={{ width: 128, alignItems: "center", justifyContent: "center" }}
        >
          <AppLottie
            source={require("../../../../assets/animations/diet-list.json")}
            size={128}
            loop
            autoPlay
          />
        </View>

        <View
          style={{
            flex: 1,
            alignItems: "flex-start",
            justifyContent: "center",
          }}
        >
          <AppText
            className="font-heading"
            style={{
              fontSize: 16,
              fontWeight: "700",
              letterSpacing: -0.5,
              lineHeight: 26,
              color: "#FFFFFF",
              textAlign: "left",
              marginBottom: 8,
            }}
          >
            Responda a avaliação
          </AppText>
          <AppText
            style={{
              fontSize: 14,
              lineHeight: 20,
              color: "#888888",
              textAlign: "left",
            }}
          >
            Você precisa responder a sua avaliação para que possamos fazer o seu
            treino e sua dieta do jeito certo para você.
          </AppText>
        </View>
      </View>

      <View style={{ width: "100%" }}>
        <HomeActionButton
          label="Responder agora"
          onPress={onPress}
          loading={loading}
          rightIcon={
            !loading ? (
              <ArrowRight size={16} color="#FFFFFF" weight="bold" />
            ) : undefined
          }
        />
      </View>
    </View>
  );
}

/* ─── Stat Card ──────────────────────────────────────────────────────────── */

type StatCardProps = {
  label: string;
  value: string;
  unit: string;
  iconColor: string;
  iconBg: string;
  icon: React.ReactNode;
};

function StatCard({
  label,
  value,
  unit,
  iconColor,
  iconBg,
  icon,
}: StatCardProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#111111",
        borderWidth: 1,
        borderColor: "#222222",
        borderRadius: 20,
        padding: 14,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 99,
          backgroundColor: iconBg,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        {icon}
      </View>
      <AppText
        style={{
          fontSize: 11,
          fontWeight: "500",
          color: "#888888",
          marginBottom: 4,
        }}
      >
        {label}
      </AppText>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 3 }}>
        <AppText
          style={{
            fontSize: 22,
            fontWeight: "700",
            letterSpacing: -0.5,
            lineHeight: 24,
          }}
        >
          {value}
        </AppText>
        <AppText style={{ fontSize: 11, fontWeight: "400", color: "#777777" }}>
          {unit}
        </AppText>
      </View>
    </View>
  );
}

/* ─── Screen ─────────────────────────────────────────────────────────────── */

export function HomeScreen() {
  const { session } = useAuthStore();
  const [isCreating, setIsCreating] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);

  const { data: workoutData, refetch: refetchWorkout } = useQuery({
    queryKey: ["current-workout"],
    queryFn: () => getCurrentWorkout(session?.token!),
    enabled: !!session?.token,
  });

  const { data: dietData, refetch: refetchDiet } = useQuery({
    queryKey: ["current-diet"],
    queryFn: () => getCurrentDiet(session?.token!),
    enabled: !!session?.token,
  });

  const { data: evaluations, refetch: refetchEvaluations } = useQuery({
    queryKey: ["assessments"],
    queryFn: () => getStudentEvaluations(session?.token!),
    enabled: !!session?.token,
  });
  useRefetchOnFocus(refetchWorkout, Boolean(session?.token));
  useRefetchOnFocus(refetchDiet, Boolean(session?.token));
  useRefetchOnFocus(refetchEvaluations, Boolean(session?.token));

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

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h >= 6 && h < 12) return "Bom dia";
    if (h >= 12 && h < 18) return "Boa tarde";
    return "Boa noite";
  };

  const firstName = (session?.name || "Atleta").split(" ")[0];

  const questionnaire = session?.released_questionnaire;
  const hasSubmittedEvaluation = evaluations?.some(
    (ev: EvaluationDTO) =>
      (ev.questionnaire.id === questionnaire?.id ||
        (ev.questionnaire as any)._id === questionnaire?.id) &&
      ["answered", "analysis", "done"].includes(ev.status),
  );
  const showQuestionnaireCard = questionnaire && !hasSubmittedEvaluation;

  /* workout */
  const currentWorkout = workoutData?.workout ?? null;
  const hasAnyWorkout = Boolean(currentWorkout?.sessions?.length);
  const todaySession = useMemo(() => {
    if (!currentWorkout || !workoutData?.todaySessionId) return null;
    return currentWorkout.sessions.find((s) => s.id === workoutData.todaySessionId) ?? null;
  }, [currentWorkout, workoutData]);

  const validSetsCount = useMemo(() => {
    if (!todaySession) return 0;
    return todaySession.exercises.reduce(
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
  }, [todaySession]);

  const heroImageSource = useMemo<ImageSourcePropType>(() => {
    const coverUrl = todaySession?.exercises[0]?.coverUrl;
    const resolvedCoverUrl = resolveApiUrl(coverUrl);
    return resolvedCoverUrl ? { uri: resolvedCoverUrl } : WORKOUT_HERO_IMAGE;
  }, [todaySession]);

  const handleStartWorkout = () => {
    if (currentWorkout && todaySession?.id) {
      router.push(
        `/(app)/workouts/${currentWorkout.id}/session?sessionId=${todaySession.id}` as Href,
      );
      return;
    }

    if (hasAnyWorkout) {
      router.push("/(app)/(tabs)/workouts" as Href);
    }
  };

  /* diet */
  const caloriesConsumed = useMemo(() => {
    if (!dietData?.dayLog) return 0;
    return Math.round(
      dietData.dayLog.mealLogs.reduce(
        (sum, ml) =>
          sum +
          ml.foodLogs.reduce((s, fl) => s + (fl.nutrition?.calories ?? 0), 0),
        0,
      ),
    );
  }, [dietData]);

  const caloriesTarget = dietData?.diet?.targets?.calories ?? 0;
  const waterMl = dietData?.dayLog?.waterMl ?? 0;
  const waterTargetL = (dietData?.diet?.targets?.waterMl ?? 3000) / 1000;
  const caloriesValue =
    caloriesConsumed > 0
      ? caloriesConsumed.toLocaleString("pt-BR")
      : caloriesTarget > 0
        ? caloriesTarget.toLocaleString("pt-BR")
        : "—";
  const caloriesUnit =
    caloriesConsumed > 0 && caloriesTarget > 0
      ? `/${caloriesTarget.toLocaleString("pt-BR")}`
      : "kcal";
  const hydrationValueMl = waterMl > 0 ? waterMl : dietData?.diet?.targets?.waterMl ?? 0;
  const hydrationValue =
    hydrationValueMl > 0 ? (hydrationValueMl / 1000).toFixed(2).replace(".", ",") : "—";
  const hydrationUnit =
    waterMl > 0 ? `/${waterTargetL.toFixed(0)}L` : "L";
  const heroTitle = todaySession
    ? todaySession.title
    : hasAnyWorkout
      ? "Hoje é dia de descanso"
      : "Treino em preparação";
  const heroSubtitle = todaySession
    ? `${todaySession.exercises.length} exercícios programados para hoje`
    : hasAnyWorkout
      ? "Nenhum treino programado para hoje. Aproveite para recuperar."
      : "Seu treino ainda está sendo preparado pela equipe.";
  const heroMeta = todaySession?.estimatedMinutes
    ? `${todaySession.estimatedMinutes} min`
    : hasAnyWorkout
      ? "Descanso"
      : "Em breve";
  const heroButtonLabel = todaySession
    ? "Começar Treino"
    : hasAnyWorkout
      ? "Ver treinos da semana"
      : "Treino em preparo";

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* ── Header ── */}
        <PageHeader
          title={`${getGreeting()}, ${firstName}`}
          onNotificationPress={() => setNotifVisible(true)}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces
          contentContainerStyle={{ paddingBottom: 148 }}
        >
          {/* ── Week Progress Strip ── */}
          <Animated.View entering={FadeInDown.delay(80).duration(500)}>
            <WeekStrip />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160).duration(500)}>
            <HeroWorkoutCard
              sessionTitle={heroTitle}
              subtitle={heroSubtitle}
              metaText={heroMeta}
              buttonLabel={heroButtonLabel}
              imageSource={heroImageSource}
              actionEnabled={Boolean(todaySession) || hasAnyWorkout}
              onStart={handleStartWorkout}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(220).duration(500)}
            style={{ paddingHorizontal: 24 }}
          >
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <StatCard
                  label="Calorias"
                  value={caloriesValue}
                  unit={caloriesUnit}
                  iconColor="#8B5CF6"
                  iconBg="rgba(139,92,246,0.12)"
                  icon={
                    <ForkKnife size={18} color="#A78BFA" weight="duotone" />
                  }
                />
                <StatCard
                  label="Hidratação"
                  value={hydrationValue}
                  unit={hydrationUnit}
                  iconColor="#22D3EE"
                  iconBg="rgba(34,211,238,0.12)"
                  icon={<Drop size={18} color="#22D3EE" weight="duotone" />}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <StatCard
                  label="Séries"
                  value={validSetsCount > 0 ? validSetsCount.toString() : "—"}
                  unit="séries"
                  iconColor="#6366F1"
                  iconBg="rgba(99,102,241,0.12)"
                  icon={<Barbell size={18} color="#6366F1" weight="duotone" />}
                />
                <StatCard
                  label="Duração"
                  value={
                    todaySession?.estimatedMinutes
                      ? todaySession.estimatedMinutes.toString()
                      : "—"
                  }
                  unit="min"
                  iconColor="#888888"
                  iconBg="rgba(255,255,255,0.06)"
                  icon={<Timer size={18} color="#888888" weight="duotone" />}
                />
              </View>
            </View>
          </Animated.View>

          {showQuestionnaireCard && (
            <Animated.View entering={FadeInDown.delay(280).duration(500)}>
              <AssessmentPendingCard
                onPress={handleStartAssessment}
                loading={isCreating}
              />
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>

    {notifVisible ? (
      <NotificationsModal visible={notifVisible} onClose={() => setNotifVisible(false)} />
    ) : null}
    </View>
  );
}
