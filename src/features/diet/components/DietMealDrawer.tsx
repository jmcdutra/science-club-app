import * as ImagePicker from "expo-image-picker";
import {
  ArrowCounterClockwise,
  Camera,
  CaretRight,
  Check,
  CheckCircle,
  Plus,
  Prohibit,
  X,
} from "phosphor-react-native";
import { useAppTheme } from "@/src/shared/theme/appTheme";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AppButton } from "@/src/shared/components/ui/AppButton";
import { AppText } from "@/src/shared/components/ui/AppText";
import { useAuthStore } from "@/src/features/auth/services/auth.store";
import { WorkoutNativeBottomSheet } from "@/src/features/workouts/components/WorkoutNativeBottomSheet";

import {
  consumeDietMeal,
  getCurrentDiet,
  logDietFood,
  resetDietMeal,
  skipDietMeal,
} from "../api/diet";
import { useDietStore, useSelectedDietDay } from "../services/diet.store";
import type { DietFood, DietFoodSubstitution } from "../types";
import {
  formatMacro,
  getFoodLog,
  getMealConsumedMacros,
  getMealLog,
  scaleNutrition,
} from "../utils";

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
  label,
  target,
  unit,
  value,
}: {
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
    <Modal animationType="fade" transparent visible>
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
            backgroundColor: "#0A0A0A",
            borderTopLeftRadius: 38,
            borderTopRightRadius: 38,
            maxHeight: "85%",
            paddingBottom: 28,
            paddingHorizontal: 20,
            paddingTop: 16,
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 12 }}>
            <View className="h-1.5 w-10 rounded-full bg-white/10" />
          </View>
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
          <View className="mb-3 rounded-xl border border-border-subtle bg-bg-surface px-4 py-3">
            <TextInput
              placeholder="Buscar alimento..."
              placeholderTextColor="#71717A"
              style={{ color: "#FFFFFF" }}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <ScrollView
            style={{ maxHeight: 280 }}
            showsVerticalScrollIndicator={false}
          >
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
                    marginBottom: 4,
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
          </ScrollView>
          {selectedFood ? (
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: "#1F1F1F",
                paddingTop: 14,
                marginTop: 12,
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
                      onPress={() =>
                        setGrams(String((Number(grams) || 0) + 10))
                      }
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
                    Number(grams.replace(",", ".")) ||
                    selectedFood.plannedGrams;
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
      </View>
    </Modal>
  );
}

function FoodLogModal({
  food,
  mealId,
  onClose,
}: {
  food: DietFood;
  mealId: string;
  onClose: () => void;
}) {
  const { isDark } = useAppTheme();
  const { session } = useAuthStore();
  const queryClient = useQueryClient();
  const logFoodLocal = useDietStore((state) => state.logFood);
  const dayLog = useSelectedDietDay();
  const mealLog = getMealLog(dayLog, mealId);
  const initialLog = getFoodLog(mealLog, food.id);
  const [replacement, setReplacement] = useState<
    DietFoodSubstitution | undefined
  >(food.substitutions?.find((item) => item.id === initialLog?.replacedBy));
  const source = replacement ?? food;
  const [grams, setGrams] = useState(
    String(initialLog?.actualGrams ?? source.plannedGrams),
  );
  const [calories, setCalories] = useState(
    String(
      Math.round(
        initialLog?.nutrition.calories ??
          scaleNutrition(source, source.plannedGrams).calories,
      ),
    ),
  );
  const [protein, setProtein] = useState(
    formatMacro(
      initialLog?.nutrition.protein ??
        scaleNutrition(source, source.plannedGrams).protein,
      "",
    ),
  );
  const [carbs, setCarbs] = useState(
    formatMacro(
      initialLog?.nutrition.carbs ??
        scaleNutrition(source, source.plannedGrams).carbs,
      "",
    ),
  );
  const [fat, setFat] = useState(
    formatMacro(
      initialLog?.nutrition.fat ??
        scaleNutrition(source, source.plannedGrams).fat,
      "",
    ),
  );
  const [isManual, setIsManual] = useState(false);

  useEffect(() => {
    if (!isManual) {
      const numericGrams = Number(grams.replace(",", "."));
      const nutrition = scaleNutrition(
        source,
        Number.isFinite(numericGrams) ? numericGrams : 0,
      );
      setCalories(String(Math.round(nutrition.calories)));
      setProtein(formatMacro(nutrition.protein, ""));
      setCarbs(formatMacro(nutrition.carbs, ""));
      setFat(formatMacro(nutrition.fat, ""));
    }
  }, [grams, isManual, source]);

  function handleMacroChange(setter: (value: string) => void, value: string) {
    setIsManual(true);
    setter(value);
  }

  function resetToGrams() {
    setIsManual(false);
    const numericGrams = Number(grams.replace(",", "."));
    const nutrition = scaleNutrition(
      source,
      Number.isFinite(numericGrams) ? numericGrams : 0,
    );
    setCalories(String(Math.round(nutrition.calories)));
    setProtein(formatMacro(nutrition.protein, ""));
    setCarbs(formatMacro(nutrition.carbs, ""));
    setFat(formatMacro(nutrition.fat, ""));
  }

  const logMutation = useMutation({
    mutationFn: (payload: {
      mealId: string;
      foodId: string;
      actualGrams: number;
      replacementId?: string;
      customNutrition?: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      };
    }) =>
      logDietFood(session?.token!, payload.mealId, {
        foodId: payload.foodId,
        actualGrams: payload.actualGrams,
        replacementId: payload.replacementId,
        customNutrition: payload.customNutrition,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["student-diet-current"],
      });
    },
  });

  const save = async () => {
    const numericGrams = Number(grams.replace(",", "."));
    const actualGrams = Number.isFinite(numericGrams) ? numericGrams : 0;
    const customNutrition = {
      calories: Number(calories.replace(",", ".")) || 0,
      protein: Number(protein.replace(",", ".")) || 0,
      carbs: Number(carbs.replace(",", ".")) || 0,
      fat: Number(fat.replace(",", ".")) || 0,
    };

    if (food.isExtra) {
      logFoodLocal({
        mealId,
        foodId: food.id,
        actualGrams,
        replacement,
        customNutrition: isManual ? customNutrition : undefined,
      });
    } else {
      await logMutation.mutateAsync({
        mealId,
        foodId: food.id,
        actualGrams,
        replacementId: replacement?.id,
        customNutrition: isManual ? customNutrition : undefined,
      });
    }

    onClose();
  };

  const macroFields = [
    {
      label: "Calorias",
      value: calories,
      setter: setCalories,
      color: "#8B5CF6",
      unit: "kcal",
    },
    {
      label: "Proteína",
      value: protein,
      setter: setProtein,
      color: "#38BDF8",
      unit: "g",
    },
    {
      label: "Carboidratos",
      value: carbs,
      setter: setCarbs,
      color: "#F59E0B",
      unit: "g",
    },
    {
      label: "Gorduras",
      value: fat,
      setter: setFat,
      color: "#FB7185",
      unit: "g",
    },
  ];

  return (
    <Modal animationType="fade" transparent visible>
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
            backgroundColor: "#0A0A0A",
            borderTopLeftRadius: 38,
            borderTopRightRadius: 38,
            maxHeight: "92%",
            paddingBottom: 28,
          }}
        >
          <View
            style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}
          >
            <View className="h-1.5 w-10 rounded-full bg-white/10" />
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8 }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 16,
              }}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <AppText className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
                  {food.category}
                  {replacement ? " · substituído" : ""}
                </AppText>
                <AppText className="font-heading text-[20px] font-bold text-white">
                  {replacement?.name ?? food.name}
                </AppText>
                {food.notes ? (
                  <AppText className="mt-1 text-[12px] text-text-muted">
                    {food.notes}
                  </AppText>
                ) : null}
              </View>
              <Pressable
                className="h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-bg-surface"
                onPress={onClose}
              >
                <X color="#A1A1AA" size={16} weight="bold" />
              </Pressable>
            </View>

            <View
              style={{
                backgroundColor: "#111111",
                borderWidth: 1,
                borderColor: "#1F1F1F",
                borderRadius: 18,
                padding: 16,
                marginBottom: 18,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 12,
                }}
              >
                <AppText className="text-[11px] font-bold uppercase tracking-[0.1em] text-text-muted">
                  Macros calculados
                </AppText>
                <AppText className="text-[10px] text-text-muted">
                  plano: {source.plannedGrams}g
                </AppText>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {[
                  { lbl: "Kcal", val: calories, color: "#8B5CF6" },
                  { lbl: "Prot", val: protein, color: "#38BDF8" },
                  { lbl: "Carbs", val: carbs, color: "#F59E0B" },
                  { lbl: "Gord", val: fat, color: "#FB7185" },
                ].map((item) => (
                  <View
                    key={item.lbl}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      backgroundColor: "#18181B",
                      borderRadius: 12,
                      paddingVertical: 10,
                      paddingHorizontal: 6,
                    }}
                  >
                    <AppText
                      className="text-[16px] font-bold"
                      style={{ color: item.color }}
                    >
                      {item.val}
                    </AppText>
                    <AppText className="mt-1 text-[9px] font-semibold uppercase tracking-[0.06em] text-text-muted">
                      {item.lbl}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>

            {food.substitutions && food.substitutions.length > 0 ? (
              <View style={{ marginBottom: 18 }}>
                <AppText className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
                  Substituições
                </AppText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  <Pressable
                    className="rounded-full border px-4 py-2"
                    style={{
                      borderColor: !replacement ? "#8B5CF6" : "#27272A",
                      backgroundColor: !replacement ? "#8B5CF6" : "#111111",
                    }}
                    onPress={() => {
                      setReplacement(undefined);
                      setGrams(String(food.plannedGrams));
                      setIsManual(false);
                    }}
                  >
                    <AppText
                      className="text-sm font-bold"
                      style={{ color: !replacement ? "#FFFFFF" : "#E4E4E7" }}
                    >
                      Original
                    </AppText>
                  </Pressable>
                  {food.substitutions.map((sub) => {
                    const isActive = replacement?.id === sub.id;
                    return (
                      <Pressable
                        key={sub.id}
                        className="rounded-full border px-4 py-2"
                        style={{
                          borderColor: isActive ? "#8B5CF6" : "#27272A",
                          backgroundColor: isActive ? "#8B5CF6" : "#111111",
                        }}
                        onPress={() => {
                          setReplacement(sub);
                          setGrams(String(sub.plannedGrams));
                          setIsManual(false);
                        }}
                      >
                        <AppText
                          className="text-sm font-bold"
                          style={{ color: isActive ? "#FFFFFF" : "#E4E4E7" }}
                        >
                          {sub.name}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            <View style={{ marginBottom: 18 }}>
              <View className="mb-4 flex-row items-center justify-between border-b border-border-subtle pb-4">
                <AppText className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
                  Quantidade registrada
                </AppText>
                <AppText className="text-[11px] text-text-muted">
                  Prescrito: {source.plannedGrams}g
                </AppText>
              </View>
              <View className="mb-4 flex-row items-center gap-3">
                <View
                  className="flex-1 flex-row items-center rounded-2xl border border-border-subtle bg-bg-surface px-4"
                  style={{ height: 56 }}
                >
                  <TextInput
                    style={{
                      flex: 1,
                      fontSize: 30,
                      fontWeight: "700",
                      color: isDark ? "#FFFFFF" : "#111827",
                    }}
                    cursorColor="#8B5CF6"
                    keyboardType="decimal-pad"
                    onChangeText={setGrams}
                    placeholder="0"
                    placeholderTextColor={isDark ? "#333333" : "#E5E5E5"}
                    value={grams}
                  />
                  <AppText className="ml-1 text-base font-bold text-text-muted">
                    g
                  </AppText>
                </View>
                {[
                  { label: "50%", factor: 0.5 },
                  { label: "100%", factor: 1 },
                  { label: "150%", factor: 1.5 },
                ].map((preset) => (
                  <Pressable
                    key={preset.label}
                    className="rounded-full border border-border-subtle bg-bg-surface px-3 py-2"
                    onPress={() => {
                      setGrams(
                        String(Math.round(source.plannedGrams * preset.factor)),
                      );
                      setIsManual(false);
                    }}
                  >
                    <AppText className="text-xs font-bold text-text-muted">
                      {preset.label}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ marginBottom: 24 }}>
              <View className="mb-5 flex-row items-center justify-between border-b border-border-subtle pb-4">
                <AppText className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
                  Macros registrados
                </AppText>
                {isManual ? (
                  <Pressable onPress={resetToGrams}>
                    <AppText className="text-xs font-bold text-brand-secondary">
                      Recalcular
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {macroFields.map((field) => (
                  <View
                    key={field.label}
                    style={{
                      width: "47.5%",
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: isManual
                        ? `${field.color}66`
                        : isDark
                          ? "#1E1E1E"
                          : "#EBEBEB",
                      backgroundColor: isDark ? "#111111" : "#F5F5F5",
                      padding: 14,
                    }}
                  >
                    <AppText
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: field.color,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        marginBottom: 4,
                      }}
                    >
                      {field.label}
                    </AppText>
                    <View className="flex-row items-baseline gap-1">
                      <TextInput
                        style={{
                          fontSize: 22,
                          fontWeight: "700",
                          color: isDark ? "#FFFFFF" : "#111827",
                          flex: 1,
                          padding: 0,
                        }}
                        cursorColor="#8B5CF6"
                        keyboardType="decimal-pad"
                        onChangeText={(value) =>
                          handleMacroChange(field.setter, value)
                        }
                        value={field.value}
                      />
                      <AppText className="text-xs text-text-muted">
                        {field.unit}
                      </AppText>
                    </View>
                  </View>
                ))}
              </View>
              {isManual ? (
                <AppText className="mt-3 text-center text-[10px] text-text-muted">
                  Valores editados manualmente
                </AppText>
              ) : null}
            </View>
          </ScrollView>

          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 28,
              borderTopWidth: 1,
              borderTopColor: "#1A1A1A",
            }}
          >
            <AppButton
              fullWidth
              leftIcon={<Check size={16} color="#FFFFFF" weight="bold" />}
              onPress={save}
            >
              Confirmar registro
            </AppButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DietMealDrawerContent({
  mealId,
  onClose,
}: {
  mealId: string;
  onClose: () => void;
}) {
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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["student-diet-current"] }),
  });
  const skipMutation = useMutation({
    mutationFn: (targetMealId: string) =>
      skipDietMeal(session?.token!, targetMealId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["student-diet-current"] }),
  });
  const resetMutation = useMutation({
    mutationFn: (targetMealId: string) =>
      resetDietMeal(session?.token!, targetMealId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["student-diet-current"] }),
  });

  const baseMeal =
    plan.meals.find((item) => item.id === mealId) ?? plan.meals[0];
  const extraFoods = mealExtrasByDate[selectedDate]?.[baseMeal.id] ?? [];
  const meal = { ...baseMeal, foods: [...baseMeal.foods, ...extraFoods] };
  const mealLog = getMealLog(dayLog, meal.id);
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
    if (extraFoods.length > 0) {
      markMealConsumedLocal(meal.id);
    } else {
      await consumeMutation.mutateAsync(meal.id);
    }
    onClose();
  };

  const confirmSkip = () => {
    Alert.alert("Pular refeição?", "Ela ficará registrada como pulada hoje.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Pular",
        style: "destructive",
        onPress: () => {
          skipMutation.mutate(meal.id);
          onClose();
        },
      },
    ]);
  };

  return (
    <>
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 22,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: "#1A1A1A",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 14,
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <AppText className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
              {meal.time}
            </AppText>
            <AppText className="font-heading text-[20px] font-bold text-text-main">
              {meal.name}
            </AppText>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable
              className="h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-bg-surface"
              onPress={() => resetMutation.mutate(meal.id)}
            >
              <ArrowCounterClockwise color="#A78BFA" size={18} weight="bold" />
            </Pressable>
            <Pressable
              onPress={confirmSkip}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: "rgba(251,113,133,.10)",
                borderWidth: 1,
                borderColor: "rgba(251,113,133,.2)",
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <Prohibit color="#FB7185" size={14} weight="bold" />
              <AppText className="text-[10px] font-bold uppercase tracking-[0.1em] text-red-400">
                Pular
              </AppText>
            </Pressable>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <MacroChip
            label="Kcal"
            target={Math.round(plannedTotal.calories)}
            value={consumedTotal.calories}
          />
          <MacroChip
            label="Prot"
            target={Math.round(plannedTotal.protein)}
            unit="g"
            value={consumedTotal.protein}
          />
          <MacroChip
            label="Carbs"
            target={Math.round(plannedTotal.carbs)}
            unit="g"
            value={consumedTotal.carbs}
          />
          <MacroChip
            label="Gord"
            target={Math.round(plannedTotal.fat)}
            unit="g"
            value={consumedTotal.fat}
          />
        </View>
      </View>

      <ScrollView
        style={{ maxHeight: 460 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8 }}
        showsVerticalScrollIndicator={false}
      >
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
                  backgroundColor: isLogged ? "rgba(34,197,94,.15)" : "#111111",
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

        <Pressable
          className="mt-2 items-center justify-center rounded-xl border border-dashed border-border-subtle px-3 py-3"
          onPress={() => setShowAddFood(true)}
        >
          <View className="flex-row items-center gap-2">
            <Plus color="#A1A1AA" size={13} weight="bold" />
            <AppText className="text-[13px] font-semibold text-text-muted">
              Adicionar alimento
            </AppText>
          </View>
        </Pressable>
      </ScrollView>

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: "#1A1A1A",
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 8,
          gap: 10,
        }}
      >
        {mealPhotoName ? (
          <View
            style={{
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

        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            className="h-12 w-12 items-center justify-center rounded-xl border border-border-subtle bg-bg-surface"
            onPress={chooseMealPhoto}
          >
            <Camera
              color={mealPhotoUri ? "#22C55E" : "#A1A1AA"}
              size={18}
              weight="bold"
            />
          </Pressable>
          {allDone ? (
            <AppButton fullWidth className="flex-1" onPress={onClose}>
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
      </View>

      {showAddFood ? (
        <AddFoodModal
          onAdd={(food) => addExtraFood(meal.id, food)}
          onClose={() => setShowAddFood(false)}
        />
      ) : null}
      {selectedFood ? (
        <FoodLogModal
          food={selectedFood}
          mealId={meal.id}
          onClose={() => setSelectedFood(null)}
        />
      ) : null}
    </>
  );
}

export function DietMealDrawer({
  mealId,
  onClose,
  visible,
}: {
  mealId: string | null;
  onClose: () => void;
  visible: boolean;
}) {
  if (!mealId) return null;

  return (
    <WorkoutNativeBottomSheet
      visible={visible}
      onVisibleChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DietMealDrawerContent mealId={mealId} onClose={onClose} />
    </WorkoutNativeBottomSheet>
  );
}
