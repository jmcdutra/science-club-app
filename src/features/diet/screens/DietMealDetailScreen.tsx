import * as ImagePicker from "expo-image-picker";
import {
  ArrowLeft,
  Camera,
  CaretRight,
  Check,
  CheckCircle,
  MagnifyingGlass,
  Plus,
  Prohibit,
  X,
} from "phosphor-react-native";
import { router, type Href, useLocalSearchParams } from "expo-router";
import { Alert, Pressable, ScrollView, TextInput, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AppButton } from "@/src/shared/components/ui/AppButton";
import { AppScreen } from "@/src/shared/components/ui/AppScreen";
import { AppText } from "@/src/shared/components/ui/AppText";
import { useAppTheme } from "@/src/shared/theme/appTheme";
import { useAuthStore } from "@/src/features/auth/services/auth.store";
import { WorkoutNativeBottomSheet } from "@/src/features/workouts/components/WorkoutNativeBottomSheet";
import { DietFoodLogModal } from "../components/DietFoodLogModal";

import { useDietStore, useSelectedDietDay } from "../services/diet.store";
import {
  consumeDietMeal,
  getCurrentDiet,
  saveDietMealPhoto,
  skipDietMeal,
  uploadDietMealPhoto,
} from "../api/diet";
import type { DietFood } from "../types";
import {
  getFoodLog,
  getMealConsumedMacros,
  getMealLog,
  getMealStatus,
  scaleNutrition,
} from "../utils";

const STATUS_META = {
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
} as const;

const MOCK_FOOD_LIBRARY = [
  {
    id: "extra-morango",
    name: "Morango",
    category: "Fruta",
    plannedGrams: 120,
    displayQuantity: "120g",
    nutrition: { calories: 38, protein: 1, carbs: 9, fat: 0 },
  },
  {
    id: "extra-castanha",
    name: "Castanha de caju",
    category: "Gordura",
    plannedGrams: 20,
    displayQuantity: "20g",
    nutrition: { calories: 110, protein: 3, carbs: 6, fat: 9 },
  },
  {
    id: "extra-pao",
    name: "Pão integral",
    category: "Carboidrato",
    plannedGrams: 50,
    displayQuantity: "2 fatias",
    nutrition: { calories: 132, protein: 5, carbs: 24, fat: 2 },
  },
  {
    id: "extra-whey",
    name: "Whey protein",
    category: "Proteína",
    plannedGrams: 30,
    displayQuantity: "30g",
    nutrition: { calories: 120, protein: 24, carbs: 3, fat: 2 },
  },
  {
    id: "extra-iogurte",
    name: "Iogurte zero lactose",
    category: "Proteína",
    plannedGrams: 170,
    displayQuantity: "1 pote",
    nutrition: { calories: 110, protein: 15, carbs: 10, fat: 0 },
  },
  {
    id: "extra-granola",
    name: "Granola sem açúcar",
    category: "Carboidrato",
    plannedGrams: 40,
    displayQuantity: "40g",
    nutrition: { calories: 160, protein: 4, carbs: 28, fat: 4 },
  },
];

function MacroChip({
  color,
  label,
  target,
  unit,
  value,
}: {
  color: string;
  label: string;
  target: number;
  unit?: string;
  value: number;
}) {
  const over = value > target * 1.1;
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#111111",
        borderWidth: 1,
        borderColor: "#1F1F1F",
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 8,
      }}
    >
      <AppText className="mb-1 text-[9px] font-bold uppercase tracking-[0.06em] text-text-muted">
        {label}
      </AppText>
      <AppText
        className="text-[14px] font-bold leading-none"
        style={{ color: over ? "#FB7185" : "#FFFFFF" }}
      >
        {Math.round(value)}
      </AppText>
      <AppText className="mt-1 text-[9px] text-text-muted">
        /{target}
        {unit ?? ""}
      </AppText>
    </View>
  );
}

function AddFoodModal({
  onAdd,
  onClose,
}: {
  onAdd: (food: DietFood) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [grams, setGrams] = useState("100");

  const results = useMemo(() => {
    if (!query.trim()) return MOCK_FOOD_LIBRARY;
    return MOCK_FOOD_LIBRARY.filter((food) =>
      food.name.toLowerCase().includes(query.trim().toLowerCase()),
    );
  }, [query]);

  const selectedFood =
    results.find((food) => food.id === selectedId) ??
    MOCK_FOOD_LIBRARY.find((food) => food.id === selectedId) ??
    null;

  const previewNutrition = selectedFood
    ? scaleNutrition(
        selectedFood,
        Number(grams.replace(",", ".")) || selectedFood.plannedGrams,
      )
    : null;

  return (
    <WorkoutNativeBottomSheet
      visible
      onVisibleChange={(next) => !next && onClose()}
    >
      <View style={{ backgroundColor: "#090909" }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: 8,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <AppText className="font-heading text-[18px] font-bold text-white">
              Adicionar alimento
            </AppText>
            <Pressable
              className="h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-bg-surface"
              onPress={onClose}
            >
              <X color="#A1A1AA" size={16} weight="bold" />
            </Pressable>
          </View>

          <View style={{ position: "relative", marginBottom: 12 }}>
            <View
              style={{
                position: "absolute",
                left: 14,
                top: 0,
                bottom: 0,
                zIndex: 1,
                justifyContent: "center",
              }}
            >
              <MagnifyingGlass color="#71717A" size={16} weight="bold" />
            </View>
            <TextInput
              placeholder="Buscar alimento..."
              placeholderTextColor="#71717A"
              style={{
                color: "#FFFFFF",
                backgroundColor: "#111111",
                borderWidth: 1,
                borderColor: "#222222",
                borderRadius: 14,
                paddingVertical: 13,
                paddingLeft: 40,
                paddingRight: 14,
                fontSize: 14,
              }}
              value={query}
              onChangeText={(value) => {
                setQuery(value);
                setSelectedId(null);
              }}
            />
          </View>

          <View style={{ gap: 4 }}>
            {results.map((food) => {
              const isSelected = selectedId === food.id;
              return (
                <Pressable
                  key={food.id}
                  onPress={() => {
                    setSelectedId(food.id);
                    setGrams(String(food.plannedGrams));
                  }}
                  style={{
                    borderWidth: 1,
                    borderColor: isSelected ? "#8B5CF6" : "transparent",
                    backgroundColor: isSelected
                      ? "rgba(139,92,246,0.10)"
                      : "transparent",
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: "rgba(139,92,246,0.10)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Plus color="#8B5CF6" size={14} weight="bold" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText className="text-[13px] font-semibold text-white">
                      {food.name}
                    </AppText>
                    <AppText className="text-[11px] text-text-muted">
                      {food.nutrition.calories} kcal / {food.plannedGrams}g
                    </AppText>
                  </View>
                  {isSelected ? (
                    <CheckCircle color="#8B5CF6" size={16} weight="fill" />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {selectedFood ? (
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: "#1F1F1F",
              paddingHorizontal: 20,
              paddingTop: 14,
              paddingBottom: 18,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <AppText className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
                  Quantidade
                </AppText>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Pressable
                    className="h-10 w-10 items-center justify-center rounded-xl border border-border-subtle bg-bg-surface"
                    onPress={() =>
                      setGrams(String(Math.max(5, (Number(grams) || 0) - 10)))
                    }
                  >
                    <AppText className="text-base font-bold text-white">
                      -
                    </AppText>
                  </Pressable>
                  <TextInput
                    value={grams}
                    onChangeText={setGrams}
                    keyboardType="numeric"
                    style={{
                      flex: 1,
                      backgroundColor: "#111111",
                      borderWidth: 1,
                      borderColor: "#8B5CF6",
                      borderRadius: 10,
                      color: "#FFFFFF",
                      fontSize: 16,
                      fontWeight: "700",
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      textAlign: "center",
                    }}
                  />
                  <Pressable
                    className="h-10 w-10 items-center justify-center rounded-xl border border-border-subtle bg-bg-surface"
                    onPress={() => setGrams(String((Number(grams) || 0) + 10))}
                  >
                    <AppText className="text-base font-bold text-white">
                      +
                    </AppText>
                  </Pressable>
                </View>
              </View>
              <View
                style={{
                  alignItems: "center",
                  backgroundColor: "#18181B",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
              >
                <AppText className="text-[18px] font-bold text-brand-secondary">
                  {previewNutrition?.calories ?? 0}
                </AppText>
                <AppText className="text-[9px] font-semibold text-text-muted">
                  KCAL
                </AppText>
              </View>
            </View>
            <AppButton
              fullWidth
              onPress={() => {
                const qty =
                  Number(grams.replace(",", ".")) || selectedFood.plannedGrams;
                onAdd({
                  ...selectedFood,
                  id: `extra-${Date.now()}`,
                  plannedGrams: qty,
                  displayQuantity: `${qty}g`,
                  nutrition: scaleNutrition(selectedFood, qty),
                  isExtra: true,
                  notes: "adicionado por você",
                });
                onClose();
              }}
            >
              Adicionar {selectedFood.name}
            </AppButton>
          </View>
        ) : null}
      </View>
    </WorkoutNativeBottomSheet>
  );
}

export function DietMealDetailScreen() {
  const { mealId } = useLocalSearchParams<{ mealId: string }>();
  const { isDark } = useAppTheme();
  const { session } = useAuthStore();
  const queryClient = useQueryClient();
  const plan = useDietStore((state) => state.plan);
  const setRemoteData = useDietStore((state) => state.setRemoteData);
  const mealExtrasByDate = useDietStore((state) => state.mealExtrasByDate);
  const addExtraFood = useDietStore((state) => state.addExtraFood);
  const setMealPhoto = useDietStore((state) => state.setMealPhoto);
  const markMealConsumedLocal = useDietStore((state) => state.markMealConsumed);
  const selectedDate = useDietStore((state) => state.selectedDate);
  const dayLog = useSelectedDietDay();
  const [showAddFood, setShowAddFood] = useState(false);
  const [selectedFood, setSelectedFood] = useState<DietFood | null>(null);

  const { data } = useQuery({
    queryKey: ["student-diet-current"],
    queryFn: () => getCurrentDiet(session?.token!),
    enabled: !!session?.token,
  });

  useEffect(() => {
    if (data?.diet && data?.dayLog) setRemoteData(data.diet, data.dayLog);
  }, [data?.diet, data?.dayLog, setRemoteData]);

  const consumeMutation = useMutation({
    mutationFn: (targetMealId: string) =>
      consumeDietMeal(session?.token!, targetMealId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["student-diet-current"] });
      await queryClient.invalidateQueries({ queryKey: ["student-diet-adherence"] });
    },
  });
  const skipMutation = useMutation({
    mutationFn: (targetMealId: string) =>
      skipDietMeal(session?.token!, targetMealId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["student-diet-current"] });
      await queryClient.invalidateQueries({ queryKey: ["student-diet-adherence"] });
    },
  });

  const baseMeal =
    plan.meals.find((item) => item.id === mealId) ?? plan.meals[0];
  const extraFoods = mealExtrasByDate[selectedDate]?.[baseMeal.id] ?? [];
  const meal = { ...baseMeal, foods: [...baseMeal.foods, ...extraFoods] };
  const mealLog = getMealLog(dayLog, meal.id);
  const status = getMealStatus(meal, mealLog);
  const st = STATUS_META[status];
  const plannedTotal = meal.foods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.nutrition.calories,
      protein: acc.protein + food.nutrition.protein,
      carbs: acc.carbs + food.nutrition.carbs,
      fat: acc.fat + food.nutrition.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const consumedTotal = getMealConsumedMacros(mealLog);
  const allDone = meal.foods.every((food) => getFoodLog(mealLog, food.id));
  const mealPhotoUri = mealLog?.photoUri;
  const mealPhotoName = mealLog?.photoName;

  async function persistMealPhotoIfNeeded() {
    if (!session?.token || !mealPhotoUri) return;

    const uploadResult = await uploadDietMealPhoto(session.token, mealPhotoUri, {
      name: mealPhotoName,
    });

    await saveDietMealPhoto(session.token, meal.id, {
      photoUrl: uploadResult.url,
      photoName: mealPhotoName,
    });
  }

  async function chooseMealPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.88,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setMealPhoto(meal.id, {
        photoName: asset.fileName ?? "refeicao.jpg",
        photoUri: asset.uri,
      });
    }
  }

  const handleMarkAll = async () => {
    await persistMealPhotoIfNeeded();
    if (extraFoods.length > 0) {
      markMealConsumedLocal(meal.id);
    } else {
      await consumeMutation.mutateAsync(meal.id);
    }
    router.replace(`/(app)/diet/meals/${meal.id}` as Href);
  };

  const confirmSkip = () => {
    Alert.alert("Pular refeição?", "Ela ficará registrada como pulada hoje.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Pular",
        style: "destructive",
        onPress: () => skipMutation.mutate(meal.id),
      },
    ]);
  };

  return (
    <AppScreen keyboard={false}>
      <View className="px-5 pb-36 pt-5">
        <View className="mb-4 flex-row items-center justify-between">
          <Pressable
            className="h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-bg-surface"
            onPress={() => router.back()}
          >
            <ArrowLeft
              color={isDark ? "#FFFFFF" : "#111827"}
              size={20}
              weight="bold"
            />
          </Pressable>
          <AppText className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
            {meal.time}
          </AppText>
          <Pressable
            className="h-11 w-11 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10"
            onPress={confirmSkip}
          >
            <Prohibit color="#FB7185" size={16} weight="bold" />
          </Pressable>
        </View>

        <Animated.View entering={FadeInDown.duration(400)}>
          <View
            style={{
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <View>
              <AppText className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
                {meal.time}
              </AppText>
              <AppText className="font-heading text-[20px] font-bold text-text-main">
                {meal.name}
              </AppText>
            </View>
            <View
              style={{
                backgroundColor: st.bg,
                borderRadius: 999,
                marginTop: 2,
                paddingHorizontal: 12,
                paddingVertical: 5,
              }}
            >
              <AppText
                className="text-[10px] font-bold uppercase"
                style={{ color: st.color }}
              >
                {st.label}
              </AppText>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            <MacroChip
              color="#8B5CF6"
              label="Kcal"
              target={Math.round(plannedTotal.calories)}
              value={consumedTotal.calories}
            />
            <MacroChip
              color="#38BDF8"
              label="Prot"
              target={Math.round(plannedTotal.protein)}
              unit="g"
              value={consumedTotal.protein}
            />
            <MacroChip
              color="#F59E0B"
              label="Carbs"
              target={Math.round(plannedTotal.carbs)}
              unit="g"
              value={consumedTotal.carbs}
            />
            <MacroChip
              color="#FB7185"
              label="Gord"
              target={Math.round(plannedTotal.fat)}
              unit="g"
              value={consumedTotal.fat}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          {meal.foods.map((food) => {
            const log = getFoodLog(mealLog, food.id);
            const isLogged = Boolean(log);
            const isSubbed = Boolean(log?.replacedBy);
            return (
              <Pressable
                key={food.id}
                onPress={() => setSelectedFood(food)}
                style={{
                  alignItems: "center",
                  borderBottomWidth: 1,
                  borderBottomColor: "#1A1A1A",
                  flexDirection: "row",
                  gap: 12,
                  paddingVertical: 13,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    backgroundColor: isLogged
                      ? "rgba(34,197,94,.15)"
                      : "#111111",
                    borderWidth: 1,
                    borderColor: isLogged ? "rgba(34,197,94,.3)" : "#1F1F1F",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isLogged ? (
                    <Check size={13} color="#22C55E" weight="bold" />
                  ) : (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: "#71717A",
                      }}
                    />
                  )}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 2,
                    }}
                  >
                    <AppText
                      className="text-[13px] font-semibold"
                      style={{ color: isLogged ? "#A1A1AA" : "#FFFFFF" }}
                    >
                      {log?.selectedFoodName ?? food.name}
                    </AppText>
                    {isSubbed ? (
                      <View
                        style={{
                          backgroundColor: "rgba(251,191,36,.12)",
                          borderRadius: 999,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                        }}
                      >
                        <AppText className="text-[9px] font-bold text-[#FBBF24]">
                          SUBST.
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                  <AppText className="text-[11px] text-text-muted">
                    {log
                      ? `${log.actualGrams}g registrado`
                      : `${food.displayQuantity} planejado`}
                    {food.notes ? ` · ${food.notes}` : ""}
                  </AppText>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <AppText
                    className="text-[13px] font-bold"
                    style={{ color: isLogged ? "#22C55E" : "#A1A1AA" }}
                  >
                    {Math.round((log?.nutrition ?? food.nutrition).calories)}{" "}
                    <AppText className="text-[9px] font-normal text-text-muted">
                      kcal
                    </AppText>
                  </AppText>
                  <AppText className="text-[10px] text-text-muted">
                    P{Math.round((log?.nutrition ?? food.nutrition).protein)}·C
                    {Math.round((log?.nutrition ?? food.nutrition).carbs)}·G
                    {Math.round((log?.nutrition ?? food.nutrition).fat)}
                  </AppText>
                </View>
                <CaretRight color="#71717A" size={13} weight="bold" />
              </Pressable>
            );
          })}

          {/* <Pressable
            className="mt-2 items-center justify-center rounded-xl border border-dashed border-border-subtle px-3 py-3"
            onPress={() => setShowAddFood(true)}
          >
            <View className="flex-row items-center gap-2">
              <Plus color="#A1A1AA" size={13} weight="bold" />
              <AppText className="text-[13px] font-semibold text-text-muted">
                Adicionar alimento
              </AppText>
            </View>
          </Pressable> */}
        </Animated.View>
      </View>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          borderTopWidth: 1,
          borderTopColor: "#1A1A1A",
          backgroundColor: "#050505",
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 28,
          flexDirection: "row",
          gap: 8,
        }}
      >
        <Pressable
          className="h-[52px] w-[52px] items-center justify-center rounded-[14px] border border-border-subtle bg-bg-surface"
          onPress={chooseMealPhoto}
        >
          <Camera
            color={mealPhotoUri ? "#22C55E" : "#A1A1AA"}
            size={18}
            weight="bold"
          />
        </Pressable>
        {allDone ? (
          <AppButton fullWidth className="flex-1" onPress={() => router.back()}>
            Refeição concluída
          </AppButton>
        ) : (
          <AppButton
            fullWidth
            className="flex-1"
            leftIcon={<Check size={16} color="#FFFFFF" weight="bold" />}
            onPress={handleMarkAll}
          >
            Registrar tudo como planejado
          </AppButton>
        )}
      </View>

      {mealPhotoName ? (
        <View
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            bottom: 98,
            backgroundColor: "rgba(34,197,94,.08)",
            borderWidth: 1,
            borderColor: "rgba(34,197,94,.2)",
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <AppText className="text-[12px] font-semibold text-green-500">
            Foto da refeição anexada
          </AppText>
          <AppText className="text-[11px] text-text-muted">
            {mealPhotoName}
          </AppText>
        </View>
      ) : null}

      {showAddFood ? (
        <AddFoodModal
          onAdd={(food) => addExtraFood(meal.id, food)}
          onClose={() => setShowAddFood(false)}
        />
      ) : null}
      {selectedFood ? (
        <DietFoodLogModal
          food={selectedFood}
          mealId={meal.id}
          onClose={() => setSelectedFood(null)}
        />
      ) : null}
    </AppScreen>
  );
}
