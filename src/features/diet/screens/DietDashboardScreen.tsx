import {
  AppleLogo,
  CaretRight,
  Drop,
  ForkKnife,
  Lightning,
  Minus,
  Sun,
  Moon,
  Info,
} from "phosphor-react-native";
import { router, type Href } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import * as Linking from "expo-linking";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { AppText } from "@/src/shared/components/ui/AppText";
import { NotificationsModal } from "@/src/shared/components/ui/NotificationsModal";
import { PendingFormAccessModal } from "@/src/shared/components/ui/PendingFormAccessModal";
import { PageHeader } from "@/src/shared/components/layout/PageHeader";
import { useRefetchOnFocus } from "@/src/shared/hooks/useRefetchOnFocus";
import { useAppTheme } from "@/src/shared/theme/appTheme";
import { useAuthStore } from "@/src/features/auth/services/auth.store";
import { EmptyPlanState } from "@/src/shared/components/layout/EmptyPlanState";

import {
  createEvaluation,
  getStudentEvaluations,
  type EvaluationDTO,
} from "../../assessments/api/assessments";
import { getCurrentDiet, getDietAdherence, updateDietWater } from "../api/diet";
import { useDietStore, useSelectedDietDay } from "../services/diet.store";
import {
  getAdherence,
  getConsumedMacros,
  getMealLog,
  getMealStatus,
  getNextMeal,
  getProgressPercent,
} from "../utils";
import type { DietAdherenceDay, DietFood, DietMeal, MealStatus } from "../types";

const STATUS_META: Record<
  MealStatus,
  { label: string; color: string; bg: string }
> = {
  pending: {
    label: "Planejada",
    color: "#555555",
    bg: "rgba(255,255,255,0.05)",
  },
  partial: {
    label: "Em andamento",
    color: "#FBBF24",
    bg: "rgba(251,191,36,0.10)",
  },
  done: { label: "Concluída", color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
  skipped: { label: "Pulada", color: "#FB7185", bg: "rgba(251,113,133,0.10)" },
};

type TabKey = "hoje" | "plano" | "aderencia";

function mealIcon(meal: DietMeal) {
  const key = `${meal.name} ${meal.context}`.toLowerCase();
  if (key.includes("cafe")) return Sun;
  if (key.includes("lanche")) return AppleLogo;
  if (key.includes("treino")) return Lightning;
  if (key.includes("jantar") || key.includes("ceia")) return Moon;
  return ForkKnife;
}

function formatAdherenceRange(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return "";

  const formatDay = (value: string) =>
    new Date(`${value}T12:00:00-03:00`)
      .toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "short",
        timeZone: "America/Sao_Paulo",
      })
      .replace(".", "");

  return `${formatDay(startDate)} - ${formatDay(endDate)}`;
}

function GoalPill({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#18181B",
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 12,
      }}
    >
      <AppText className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">
        {label}
      </AppText>
      <AppText
        style={{
          fontSize: 18,
          fontWeight: "700",
          color,
          marginTop: 8,
        }}
      >
        {value}
        <AppText className="text-[10px] font-normal text-text-muted">
          {" "}
          / {total}
        </AppText>
      </AppText>
    </View>
  );
}

function MacroBar({
  label,
  value,
  max,
  color,
  unit = "g",
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  unit?: string;
}) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  const over = value > max;
  return (
    <View>
      <View
        style={{
          alignItems: "baseline",
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 5,
        }}
      >
        <AppText className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">
          {label}
        </AppText>
        <AppText
          className="text-xs font-bold"
          style={{ color: over ? "#FB7185" : "#FFFFFF" }}
        >
          {Math.round(value)}
          <AppText className="text-[10px] font-normal text-text-muted">
            {" "}
            / {max}
            {unit}
          </AppText>
        </AppText>
      </View>
      <View className="h-1.5 overflow-hidden rounded-full bg-bg-elevated">
        <View
          className="h-full rounded-full"
          style={{
            backgroundColor: over ? "#FB7185" : color,
            width: `${pct}%`,
          }}
        />
      </View>
    </View>
  );
}

function MealCard({
  meal,
  foods,
  status,
  loggedItems,
  onOpen,
}: {
  meal: DietMeal;
  foods: DietFood[];
  status: MealStatus;
  loggedItems: number;
  onOpen: () => void;
}) {
  const st = STATUS_META[status];
  const total = foods.reduce((acc, food) => acc + food.nutrition.calories, 0);
  const Icon = mealIcon(meal);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onOpen}
      style={{
        alignItems: "center",
        backgroundColor: "#111111",
        borderColor: "#1F1F1F",
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: "row",
        gap: 12,
        marginBottom: 8,
        paddingHorizontal: 14,
        paddingVertical: 13,
      }}
    >
      <View
        style={{
          alignItems: "center",
          backgroundColor: st.bg,
          borderRadius: 12,
          height: 40,
          justifyContent: "center",
          width: 40,
        }}
      >
        <Icon color={st.color} size={16} weight="duotone" />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View
          style={{
            alignItems: "center",
            flexDirection: "row",
            gap: 6,
            marginBottom: 2,
          }}
        >
          <AppText className="text-[13px] font-semibold text-text-main">
            {meal.name}
          </AppText>
          <View
            style={{
              backgroundColor: st.bg,
              borderRadius: 999,
              paddingHorizontal: 7,
              paddingVertical: 2,
            }}
          >
            <AppText
              className="text-[9px] font-bold uppercase"
              style={{ color: st.color }}
            >
              {st.label}
            </AppText>
          </View>
        </View>
        <AppText className="text-[11px] text-text-muted">
          {meal.time} · {loggedItems}/{foods.length} itens ·{" "}
          {loggedItems > 0 ? Math.round(total) : Math.round(total)} kcal
        </AppText>
      </View>
      <View
        style={{
          alignItems: "center",
          flexDirection: "row",
          flexShrink: 0,
          gap: 3,
        }}
      >
        {foods.slice(0, 5).map((food, index) => (
          <View
            key={`${meal.id}-${food.id}-${index}`}
            style={{
              backgroundColor: index < loggedItems ? "#22C55E" : "#1F1F1F",
              borderRadius: 999,
              height: 6,
              width: 6,
            }}
          />
        ))}
        {foods.length > 5 ? (
          <AppText className="text-[9px] text-text-muted">
            +{foods.length - 5}
          </AppText>
        ) : null}
      </View>
      <CaretRight color="#6B7280" size={13} weight="bold" />
    </Pressable>
  );
}

export function DietDashboardScreen() {
  const { isDark } = useAppTheme();
  const { session } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>("hoje");
  const [isCreating, setIsCreating] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const queryClient = useQueryClient();
  const plan = useDietStore((state) => state.plan);
  const setRemoteData = useDietStore((state) => state.setRemoteData);
  const mealExtrasByDate = useDietStore((state) => state.mealExtrasByDate);
  const selectedDate = useDietStore((state) => state.selectedDate);
  const dayLog = useSelectedDietDay();

  const { data: evaluations, refetch: refetchEvaluations } = useQuery({
    queryKey: ["assessments"],
    queryFn: () => getStudentEvaluations(session?.token!),
    enabled: !!session?.token,
  });
  const { data, isLoading, refetch: refetchDiet } = useQuery({
    queryKey: ["student-diet-current"],
    queryFn: () => getCurrentDiet(session?.token!),
    enabled: !!session?.token,
  });
  const { data: adherenceData, refetch: refetchAdherence } = useQuery({
    queryKey: ["student-diet-adherence"],
    queryFn: () => getDietAdherence(session?.token!),
    enabled: !!session?.token,
  });
  useRefetchOnFocus(refetchEvaluations, Boolean(session?.token));
  useRefetchOnFocus(refetchDiet, Boolean(session?.token));
  useRefetchOnFocus(refetchAdherence, Boolean(session?.token));
  const addWaterMutation = useMutation({
    mutationFn: (amountMl: number) =>
      updateDietWater(session?.token!, amountMl),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["student-diet-current"] });
      await queryClient.invalidateQueries({ queryKey: ["student-diet-adherence"] });
    },
  });

  useEffect(() => {
    if (data?.diet && data?.dayLog) setRemoteData(data.diet, data.dayLog);
  }, [data?.diet, data?.dayLog, setRemoteData]);

  const questionnaire = session?.released_questionnaire;
  const upgradeUrl = data?.whatsappUpgradeUrl;
  const hasSubmittedEvaluation = evaluations?.some(
    (ev: EvaluationDTO) =>
      (ev.questionnaire.id === questionnaire?.id ||
        (ev.questionnaire as any)._id === questionnaire?.id) &&
      ["answered", "analysis", "done"].includes(ev.status),
  );
  const showQuestionnaire = Boolean(questionnaire && !hasSubmittedEvaluation);

  const handleStartAssessment = async () => {
    if (data?.appAccessLock?.evaluationId) {
      router.push(`/(app)/assessments/${data.appAccessLock.evaluationId}` as Href);
      return;
    }
    if (!session?.token || !session?.released_questionnaire?.id) return;
    try {
      setIsCreating(true);
      const evalData = await createEvaluation(
        session.token,
        session.released_questionnaire.id,
      );
      router.push(`/(app)/assessments/${evalData.id}` as Href);
    } finally {
      setIsCreating(false);
    }
  };

  if (data?.appAccessLock?.enabled) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <PendingFormAccessModal
          visible
          questionnaireTitle={data.appAccessLock.questionnaireTitle}
          description={data.appAccessLock.message}
          onSubmit={handleStartAssessment}
        />
      </View>
    )
  }

  if (!isLoading && data?.hasAccess === false) {
    return (
      <EmptyPlanState
        eyebrow="Acesso restrito"
        title="Seu plano ainda não inclui dieta"
        subtitle="Nossa equipe pode liberar o acompanhamento nutricional para você. Assim que estiver ativo, tudo aparecerá aqui."
        action={
          upgradeUrl
            ? {
                label: "Falar com a equipe",
                onPress: () => Linking.openURL(upgradeUrl),
              }
            : null
        }
      />
    );
  }

  if (!isLoading && data?.hasAccess !== false && !data?.diet) {
    if (showQuestionnaire) {
      return (
        <EmptyPlanState
          eyebrow="Ação necessária"
          title="Responda a avaliação"
          subtitle="Antes de montar sua dieta, nossa equipe precisa das suas respostas para preparar um plano alinhado com sua rotina."
          action={{
            label: isCreating ? "Carregando..." : "Responder agora",
            onPress: handleStartAssessment,
          }}
        />
      );
    }

    return (
      <EmptyPlanState
        eyebrow="Responda a avaliação"
        title="Sua dieta está sendo preparada"
        subtitle="Nossa equipe está montando seu plano alimentar personalizado. Assim que ele estiver pronto, você verá tudo aqui."
      />
    );
  }

  const extrasByMeal = mealExtrasByDate[selectedDate] ?? {};
  const meals = plan.meals.map((meal) => ({
    ...meal,
    foods: [...meal.foods, ...(extrasByMeal[meal.id] ?? [])],
  }));

  const consumed = getConsumedMacros(dayLog);
  const adherence = getAdherence(plan, dayLog);
  const nextMeal = getNextMeal(plan, dayLog);
  const waterGoal = plan.targets.waterMl;
  const waterPct = Math.min(100, getProgressPercent(dayLog.waterMl, waterGoal));
  const completedMeals = meals.filter(
    (meal) => getMealStatus(meal, getMealLog(dayLog, meal.id)) === "done",
  ).length;
  const goals = {
    kcal: plan.targets.calories,
    p: plan.targets.protein,
    c: plan.targets.carbs,
    fat: plan.targets.fat,
  };
  const weeklyDays = adherenceData?.days ?? [];
  const weeklySummary = adherenceData?.summary;
  const weeklyRange = adherenceData?.range;

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <PendingFormAccessModal
          visible={Boolean(data?.appAccessLock?.enabled)}
          questionnaireTitle={data?.appAccessLock?.questionnaireTitle}
          description={data?.appAccessLock?.message}
          onSubmit={handleStartAssessment}
        />
        <PageHeader title="Dieta" onNotificationPress={() => setNotifVisible(true)} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 148, paddingTop: 4 }}
        >
        <Animated.View entering={FadeInDown.duration(400)}>
          <View className="mb-5 flex-row gap-1 rounded-xl bg-bg-surface p-1">
            {(
              [
                ["hoje", "Hoje"],
                ["plano", "Plano Alimentar"],
                ["aderencia", "Aderência"],
              ] as [TabKey, string][]
            ).map(([key, label]) => {
              const active = activeTab === key;
              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  className="flex-1 rounded-[9px] px-2 py-2"
                  onPress={() => setActiveTab(key)}
                  style={{
                    backgroundColor: active
                      ? isDark
                        ? "#18181B"
                        : "#FFFFFF"
                      : "transparent",
                  }}
                >
                  <AppText
                    className={
                      active
                        ? "text-center text-[11px] font-bold text-text-main"
                        : "text-center text-[11px] font-bold text-text-muted"
                    }
                  >
                    {label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {activeTab === "hoje" ? (
          <>
            <Animated.View
              entering={FadeInDown.delay(80).duration(400)}
              style={{
                backgroundColor: "#111111",
                borderWidth: 1,
                borderColor: "#1F1F1F",
                borderRadius: 20,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <AppText className="text-[15px] font-bold text-text-main">
                  Resumo do dia
                </AppText>
                <AppText className="text-[20px] font-bold text-brand-secondary">
                  {Math.round(consumed.calories)}
                  <AppText className="text-[11px] font-normal text-text-muted">
                    {" "}
                    / {goals.kcal} kcal
                  </AppText>
                </AppText>
              </View>

              <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
                {[
                  {
                    lbl: "Proteína",
                    val: Math.round(consumed.protein),
                    max: goals.p,
                    color: "#38BDF8",
                  },
                  {
                    lbl: "Carbs",
                    val: Math.round(consumed.carbs),
                    max: goals.c,
                    color: "#F59E0B",
                  },
                  {
                    lbl: "Gorduras",
                    val: Math.round(consumed.fat),
                    max: goals.fat,
                    color: "#FB7185",
                  },
                ].map((macro) => {
                  const pct = Math.min(
                    100,
                    (macro.val / Math.max(1, macro.max)) * 100,
                  );
                  return (
                    <View
                      key={macro.lbl}
                      style={{
                        alignItems: "center",
                        backgroundColor: "#18181B",
                        borderRadius: 14,
                        flex: 1,
                        gap: 5,
                        paddingBottom: 8,
                        paddingHorizontal: 10,
                        paddingTop: 10,
                      }}
                    >
                      <View
                        style={{
                          alignItems: "center",
                          borderColor: `${macro.color}22`,
                          borderRadius: 999,
                          borderWidth: 3,
                          height: 40,
                          justifyContent: "center",
                          width: 40,
                        }}
                      >
                        <View
                          style={{
                            position: "absolute",
                            inset: -3,
                            borderRadius: 999,
                            borderWidth: 3,
                            borderColor: "transparent",
                            borderTopColor: macro.color,
                            transform: [{ rotate: `${pct * 3.6}deg` }],
                          }}
                        />
                      </View>
                      <AppText className="text-[13px] font-bold text-text-main">
                        {macro.val}g
                      </AppText>
                      <AppText className="text-[9px] font-semibold uppercase tracking-[0.06em] text-text-muted">
                        {macro.lbl}
                      </AppText>
                    </View>
                  );
                })}
              </View>

              <MacroBar
                label="Calorias"
                value={consumed.calories}
                max={goals.kcal}
                color="#8B5CF6"
                unit=" kcal"
              />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(140).duration(400)}
              style={{
                backgroundColor: "#111111",
                borderWidth: 1,
                borderColor: "#1F1F1F",
                borderRadius: 16,
                padding: 14,
                marginBottom: 14,
              }}
            >
              <View
                style={{
                  alignItems: "center",
                  flexDirection: "row",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    alignItems: "center",
                    backgroundColor: "rgba(34,211,238,.12)",
                    borderRadius: 999,
                    height: 32,
                    justifyContent: "center",
                    width: 32,
                  }}
                >
                  <Drop color="#22D3EE" size={16} weight="duotone" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText className="text-[12px] font-bold text-cyan-400">
                    Hidratação
                  </AppText>
                  <AppText className="text-[10px] text-text-muted">
                    Meta: {waterGoal / 1000}L/dia
                  </AppText>
                </View>
                <AppText className="text-[16px] font-bold text-cyan-400">
                  {(dayLog.waterMl / 1000).toFixed(2).replace(".", ",")}
                  <AppText className="text-[10px] font-normal text-text-muted">
                    {" "}
                    / {(waterGoal / 1000).toFixed(0)}L
                  </AppText>
                </AppText>
              </View>
              <View className="mb-2 h-1.5 overflow-hidden rounded-full bg-cyan-400/15">
                <View
                  className="h-full rounded-full bg-cyan-400"
                  style={{ width: `${waterPct}%` }}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {[150, 250, 500].map((ml) => (
                  <Pressable
                    key={ml}
                    style={{
                      alignItems: "center",
                      backgroundColor: "rgba(34,211,238,.10)",
                      borderRadius: 9,
                      flex: 1,
                      height: 32,
                      justifyContent: "center",
                    }}
                    onPress={() => addWaterMutation.mutate(ml)}
                  >
                    <AppText className="text-[11px] font-bold text-cyan-400">
                      +{ml}ml
                    </AppText>
                  </Pressable>
                ))}
                <Pressable
                  style={{
                    alignItems: "center",
                    backgroundColor: "rgba(251,113,133,.08)",
                    borderRadius: 9,
                    height: 32,
                    justifyContent: "center",
                    width: 32,
                  }}
                  onPress={() => addWaterMutation.mutate(-250)}
                >
                  <Minus color="#FB7185" size={13} weight="bold" />
                </Pressable>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <View className="mb-2 flex-row items-center justify-between">
                <AppText className="text-[11px] font-bold uppercase tracking-[0.22em] text-text-muted">
                  Refeições
                </AppText>
                <AppText className="text-xs font-semibold text-brand-secondary">
                  {completedMeals}/{meals.length} concluídas
                </AppText>
              </View>
              {meals.map((meal) => {
                const mealLog = getMealLog(dayLog, meal.id);
                const status = getMealStatus(meal, mealLog);
                const loggedItems = meal.foods.filter((food) =>
                  mealLog?.foodLogs.some((item) => item.foodId === food.id),
                ).length;
                return (
                  <MealCard
                    key={meal.id}
                    foods={meal.foods}
                    loggedItems={loggedItems}
                    meal={meal}
                    status={
                      meal.id === nextMeal.id && status === "pending"
                        ? "partial"
                        : status
                    }
                    onOpen={() =>
                      router.push(`/(app)/diet/meals/${meal.id}` as Href)
                    }
                  />
                );
              })}
            </Animated.View>
          </>
        ) : null}

        {activeTab === "plano" ? (
          <Animated.View entering={FadeInDown.delay(80).duration(400)}>
            <View
              style={{
                alignItems: "center",
                backgroundColor: "rgba(139,92,246,.08)",
                borderColor: "rgba(139,92,246,.2)",
                borderRadius: 14,
                borderWidth: 1,
                flexDirection: "row",
                gap: 10,
                marginBottom: 16,
                paddingHorizontal: 14,
                paddingVertical: 12,
              }}
            >
              <Info color="#8B5CF6" size={16} weight="bold" />
              <AppText className="flex-1 text-[12px] leading-[18px] text-text-muted">
                Plano alimentar prescrito pelo seu coach. Para ajustes, entre em
                contato.
              </AppText>
            </View>
            {meals.map((meal) => {
              const total = meal.foods.reduce(
                (acc, food) => ({
                  calories: acc.calories + food.nutrition.calories,
                  protein: acc.protein + food.nutrition.protein,
                  carbs: acc.carbs + food.nutrition.carbs,
                  fat: acc.fat + food.nutrition.fat,
                }),
                { calories: 0, protein: 0, carbs: 0, fat: 0 },
              );
              return (
                <Pressable
                  key={meal.id}
                  onPress={() =>
                    router.push(`/(app)/diet/meals/${meal.id}` as Href)
                  }
                  style={{
                    backgroundColor: "#111111",
                    borderWidth: 1,
                    borderColor: "#1F1F1F",
                    borderRadius: 20,
                    marginBottom: 12,
                    padding: 16,
                  }}
                >
                  <View
                    style={{
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <View>
                      <AppText className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                        {meal.time}
                      </AppText>
                      <AppText className="font-heading text-[17px] font-bold text-text-main">
                        {meal.name}
                      </AppText>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <AppText className="text-[16px] font-bold text-brand-secondary">
                        {Math.round(total.calories)} kcal
                      </AppText>
                      <AppText className="text-[10px] text-text-muted">
                        P{Math.round(total.protein)}·C{Math.round(total.carbs)}
                        ·G{Math.round(total.fat)}g
                      </AppText>
                    </View>
                  </View>
                  {meal.foods.map((food) => (
                    <View
                      key={food.id}
                      style={{
                        alignItems: "center",
                        borderTopWidth: 1,
                        borderTopColor: "#1F1F1F",
                        flexDirection: "row",
                        gap: 10,
                        paddingVertical: 9,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <AppText className="text-[13px] font-semibold text-text-main">
                          {food.name}
                        </AppText>
                        {food.isExtra ? (
                          <View
                            style={{
                              alignSelf: "flex-start",
                              backgroundColor: "rgba(251,191,36,.12)",
                              borderRadius: 999,
                              marginTop: 4,
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                            }}
                          >
                            <AppText className="text-[9px] font-bold text-[#FBBF24]">
                              EXTRA
                            </AppText>
                          </View>
                        ) : null}
                        {food.notes ? (
                          <AppText className="text-[11px] text-text-muted">
                            {food.notes}
                          </AppText>
                        ) : null}
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <AppText className="text-[12px] font-bold text-text-main">
                          {food.displayQuantity}
                        </AppText>
                        <AppText className="text-[10px] text-text-muted">
                          {food.nutrition.calories} kcal
                        </AppText>
                      </View>
                    </View>
                  ))}
                </Pressable>
              );
            })}
          </Animated.View>
        ) : null}

        {activeTab === "aderencia" ? (
          <Animated.View entering={FadeInDown.delay(80).duration(400)}>
            <View
              style={{
                backgroundColor: "#111111",
                borderWidth: 1,
                borderColor: "#1F1F1F",
                borderRadius: 20,
                marginBottom: 12,
                padding: 16,
              }}
            >
              <View
                style={{
                  alignItems: "baseline",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <View>
                  <AppText className="text-[15px] font-bold text-text-main">
                    Aderência semanal
                  </AppText>
                  <AppText className="text-[11px] text-text-muted">
                    {formatAdherenceRange(
                      weeklyRange?.startDate,
                      weeklyRange?.endDate,
                    )}
                  </AppText>
                </View>
                <View
                  style={{
                    backgroundColor: "rgba(34,197,94,.12)",
                    borderRadius: 999,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <AppText className="text-[13px] font-bold text-green-500">
                    {weeklySummary?.averageAdherence ?? adherence}% média
                  </AppText>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                <GoalPill
                  label="Água"
                  value={weeklySummary?.daysHitWaterGoal ?? 0}
                  total={weeklyDays.length || 7}
                  color="#22D3EE"
                />
                <GoalPill
                  label="Calorias"
                  value={weeklySummary?.daysHitCaloriesGoal ?? 0}
                  total={weeklyDays.length || 7}
                  color="#8B5CF6"
                />
                <GoalPill
                  label="Proteínas"
                  value={weeklySummary?.daysHitProteinGoal ?? 0}
                  total={weeklyDays.length || 7}
                  color="#38BDF8"
                />
              </View>
              <View
                style={{
                  backgroundColor: "#18181B",
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  marginBottom: 16,
                }}
              >
                <AppText className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">
                  Refeições no horário
                </AppText>
                <AppText className="mt-2 text-[18px] font-bold text-text-main">
                  {weeklySummary?.mealsOnTime ?? 0}
                  <AppText className="text-[11px] font-normal text-text-muted">
                    {" "}
                    / {weeklySummary?.totalMealsLogged ?? 0} registros no prazo
                  </AppText>
                </AppText>
                <AppText className="mt-2 text-[11px] leading-[17px] text-text-muted">
                  No horário significa registrar a refeição com até 30 minutos
                  antes ou depois do horário planejado.
                </AppText>
              </View>
              <View
                style={{
                  alignItems: "flex-end",
                  flexDirection: "row",
                  gap: 6,
                  height: 60,
                }}
              >
                {weeklyDays.map((day: DietAdherenceDay) => {
                  const val = day.adherencePercent;
                  const color =
                    val >= 80 ? "#22C55E" : val >= 60 ? "#F59E0B" : "#FB7185";
                  return (
                    <View
                      key={day.date}
                      style={{ alignItems: "center", flex: 1, gap: 5 }}
                    >
                      <View
                        style={{
                          width: "100%",
                          minHeight: 4,
                          height: Math.max(val * 0.5, 4),
                          borderRadius: 5,
                          backgroundColor: val > 0 ? color : "#1A1A1A",
                        }}
                      />
                      <AppText className="text-[9px] font-semibold text-text-muted">
                        {day.label}
                      </AppText>
                    </View>
                  );
                })}
              </View>
            </View>
          </Animated.View>
        ) : null}
        </ScrollView>
      </SafeAreaView>

      <NotificationsModal visible={notifVisible} onClose={() => setNotifVisible(false)} />
    </View>
  );
}
