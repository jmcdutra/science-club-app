import { ArrowLeft, Check } from "phosphor-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AppScreen } from "@/src/shared/components/ui/AppScreen";
import { AppText } from "@/src/shared/components/ui/AppText";
import { useAppTheme } from "@/src/shared/theme/appTheme";
import { cn } from "@/src/shared/utils/cn";
import { useAuthStore } from "@/src/features/auth/services/auth.store";

import { useDietStore } from "../services/diet.store";
import { getCurrentDiet, logDietFood } from "../api/diet";
import { DietFoodSubstitution } from "../types";
import { formatMacro, scaleNutrition } from "../utils";

export function DietLogScreen() {
  const { isDark } = useAppTheme();
  const { session } = useAuthStore();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    mealId?: string;
    foodId?: string;
    replacementId?: string;
  }>();
  const plan = useDietStore((state) => state.plan);
  const setRemoteData = useDietStore((state) => state.setRemoteData);
  const mealExtrasByDate = useDietStore((state) => state.mealExtrasByDate);
  const selectedDate = useDietStore((state) => state.selectedDate);
  const logFoodLocal = useDietStore((state) => state.logFood);
  const { data } = useQuery({
    queryKey: ["student-diet-current"],
    queryFn: () => getCurrentDiet(session?.token!),
    enabled: !!session?.token,
  });
  useEffect(() => {
    if (data?.diet && data?.dayLog) setRemoteData(data.diet, data.dayLog);
  }, [data?.diet, data?.dayLog, setRemoteData]);

  const logMutation = useMutation({
    mutationFn: (payload: {
      mealId: string;
      foodId: string;
      actualGrams: number;
      replacementId?: string;
      customNutrition?: any;
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

  const extraFoodsByMeal = mealExtrasByDate[selectedDate] ?? {};
  const meals = plan.meals.map((meal) => ({
    ...meal,
    foods: [...meal.foods, ...(extraFoodsByMeal[meal.id] ?? [])],
  }));

  const initialMeal =
    meals.find((meal) => meal.id === params.mealId) ?? meals[0];
  const [mealId, setMealId] = useState(initialMeal.id);
  const selectedMeal = meals.find((meal) => meal.id === mealId) ?? initialMeal;

  const initialFood =
    selectedMeal.foods.find((food) => food.id === params.foodId) ??
    selectedMeal.foods[0];
  const [foodId, setFoodId] = useState(initialFood.id);
  const selectedFood =
    selectedMeal.foods.find((food) => food.id === foodId) ??
    selectedMeal.foods[0];

  const initialReplacement = selectedFood.substitutions?.find(
    (item) => item.id === params.replacementId,
  );
  const [replacement, setReplacement] = useState<
    DietFoodSubstitution | undefined
  >(initialReplacement);
  const source = replacement ?? selectedFood;

  const [grams, setGrams] = useState(String(source.plannedGrams));
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [isManual, setIsManual] = useState(false);

  // Auto-calculate nutrition when grams change, unless in manual mode
  useEffect(() => {
    if (!isManual) {
      const numericGrams = Number(grams.replace(",", "."));
      const nutrition = scaleNutrition(
        source,
        Number.isFinite(numericGrams) ? numericGrams : 0,
      );
      setCalories(String(Math.round(nutrition.calories)));
      setProtein(String(formatMacro(nutrition.protein)));
      setCarbs(String(formatMacro(nutrition.carbs)));
      setFat(String(formatMacro(nutrition.fat)));
    }
  }, [grams, source, isManual]);

  function handleMacroChange(setter: (v: string) => void, value: string) {
    setIsManual(true);
    setter(value);
  }

  function resetToGrams() {
    setIsManual(false);
    const n = Number(grams.replace(",", "."));
    const nutrition = scaleNutrition(source, Number.isFinite(n) ? n : 0);
    setCalories(String(Math.round(nutrition.calories)));
    setProtein(String(formatMacro(nutrition.protein)));
    setCarbs(String(formatMacro(nutrition.carbs)));
    setFat(String(formatMacro(nutrition.fat)));
  }

  const save = async () => {
    const numericGrams = Number(grams.replace(",", "."));
    const customNutrition = {
      calories: Number(calories.replace(",", ".")) || 0,
      protein: Number(protein.replace(",", ".")) || 0,
      carbs: Number(carbs.replace(",", ".")) || 0,
      fat: Number(fat.replace(",", ".")) || 0,
    };

    if (selectedFood.isExtra) {
      logFoodLocal({
        mealId: selectedMeal.id,
        foodId: selectedFood.id,
        actualGrams: Number.isFinite(numericGrams) ? numericGrams : 0,
        replacement,
        customNutrition: isManual ? customNutrition : undefined,
      });
    } else {
      await logMutation.mutateAsync({
        mealId: selectedMeal.id,
        foodId: selectedFood.id,
        actualGrams: Number.isFinite(numericGrams) ? numericGrams : 0,
        replacementId: replacement?.id,
        customNutrition: isManual ? customNutrition : undefined,
      });
    }
    router.replace(`/(app)/diet/meals/${selectedMeal.id}`);
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
    <AppScreen keyboard contentClassName="px-6 pb-32 pt-8">
      {/* Header */}
      <View className="mb-10 flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center rounded-full bg-bg-surface border border-border-subtle"
          onPress={() => router.back()}
        >
          <ArrowLeft
            color={isDark ? "#FFFFFF" : "#111827"}
            size={20}
            weight="bold"
          />
        </Pressable>
        <AppText className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">
          Registrar Alimento
        </AppText>
        <Pressable
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center rounded-full bg-bg-surface border border-border-subtle"
          onPress={save}
        >
          <Check color="#A78BFA" size={18} weight="bold" />
        </Pressable>
      </View>

      {/* Meal Selection */}
      <Animated.View entering={FadeInDown.duration(400)} className="mb-8">
        <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em] mb-4">
          Refeição
        </AppText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2.5"
        >
          {meals.map((meal) => {
            const isSelected = meal.id === selectedMeal.id;
            return (
              <Pressable
                key={meal.id}
                accessibilityRole="button"
                className={cn(
                  "rounded-full border px-5 py-2.5",
                  isSelected
                    ? "border-brand-primary bg-brand-primary"
                    : "border-border-subtle bg-bg-surface",
                )}
                onPress={() => {
                  setMealId(meal.id);
                  setFoodId(meal.foods[0].id);
                  setReplacement(undefined);
                  setGrams(String(meal.foods[0].plannedGrams));
                  setIsManual(false);
                }}
              >
                <AppText
                  className={cn(
                    "text-sm font-bold",
                    isSelected ? "text-white" : "text-text-main",
                  )}
                >
                  {meal.name}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Food Selection */}
      <Animated.View
        entering={FadeInDown.delay(50).duration(400)}
        className="mb-8"
      >
        <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em] mb-4">
          Alimento
        </AppText>
        <View className="gap-2.5">
          {selectedMeal.foods.map((food) => {
            const isSelected = food.id === selectedFood.id;
            return (
              <Pressable
                key={food.id}
                accessibilityRole="button"
                className={cn(
                  "flex-row items-center rounded-2xl border px-4 py-4",
                  isSelected
                    ? "border-brand-primary bg-brand-primary/10"
                    : "border-border-subtle bg-bg-surface",
                )}
                onPress={() => {
                  setFoodId(food.id);
                  setReplacement(undefined);
                  setGrams(String(food.plannedGrams));
                  setIsManual(false);
                }}
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    marginRight: 12,
                    backgroundColor: isSelected
                      ? "#8B5CF6"
                      : isDark
                        ? "#333333"
                        : "#CCCCCC",
                  }}
                />
                <View className="flex-1">
                  <AppText className="text-base font-bold text-text-main">
                    {food.name}
                  </AppText>
                  <AppText className="mt-0.5 text-xs text-text-muted">
                    {food.displayQuantity}
                  </AppText>
                </View>
                {isSelected && (
                  <Check color="#A78BFA" size={16} weight="bold" />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Substitutions */}
        {selectedFood.substitutions &&
          selectedFood.substitutions.length > 0 && (
            <View className="mt-4">
              <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em] mb-3">
                Substituições
              </AppText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2"
              >
                <Pressable
                  accessibilityRole="button"
                  className={cn(
                    "rounded-full border px-4 py-2",
                    !replacement
                      ? "border-brand-primary bg-brand-primary"
                      : "border-border-subtle bg-bg-surface",
                  )}
                  onPress={() => {
                    setReplacement(undefined);
                    setIsManual(false);
                    setGrams(String(selectedFood.plannedGrams));
                  }}
                >
                  <AppText
                    className={cn(
                      "text-sm font-bold",
                      !replacement ? "text-white" : "text-text-main",
                    )}
                  >
                    Original
                  </AppText>
                </Pressable>
                {selectedFood.substitutions.map((sub) => {
                  const isActive = replacement?.id === sub.id;
                  return (
                    <Pressable
                      key={sub.id}
                      accessibilityRole="button"
                      className={cn(
                        "rounded-full border px-4 py-2",
                        isActive
                          ? "border-brand-primary bg-brand-primary"
                          : "border-border-subtle bg-bg-surface",
                      )}
                      onPress={() => {
                        setReplacement(sub);
                        setIsManual(false);
                        setGrams(String(sub.plannedGrams));
                      }}
                    >
                      <AppText
                        className={cn(
                          "text-sm font-bold",
                          isActive ? "text-white" : "text-text-main",
                        )}
                      >
                        {sub.name}
                      </AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
      </Animated.View>

      {/* Grams Section */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(600)}
        className="mb-8"
      >
        <View className="flex-row items-center justify-between border-b border-border-subtle pb-4 mb-6">
          <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">
            Gramagem
          </AppText>
          <AppText className="text-xs text-text-muted">
            Prescrito: {source.plannedGrams}g
          </AppText>
        </View>

        <View className="flex-row items-center gap-3 mb-4">
          <View
            className="flex-1 flex-row items-center rounded-2xl bg-bg-surface border border-border-subtle px-4"
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
              selectionColor="#8B5CF6"
              value={grams}
            />
            <AppText className="text-base font-bold text-text-muted ml-1">
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
              accessibilityRole="button"
              className="px-3 py-2 rounded-full bg-bg-surface border border-border-subtle"
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
      </Animated.View>

      {/* Macros Section */}
      <Animated.View
        entering={FadeInDown.delay(150).duration(600)}
        className="mb-12"
      >
        <View className="flex-row items-center justify-between border-b border-border-subtle pb-4 mb-5">
          <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">
            Macros Registrados
          </AppText>
          {isManual && (
            <Pressable accessibilityRole="button" onPress={resetToGrams}>
              <AppText
                className="text-xs font-bold"
                style={{ color: "#A78BFA" }}
              >
                ↩ Recalcular
              </AppText>
            </Pressable>
          )}
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
                  onChangeText={(v) => handleMacroChange(field.setter, v)}
                  value={field.value}
                />
                <AppText className="text-xs text-text-muted">
                  {field.unit}
                </AppText>
              </View>
            </View>
          ))}
        </View>

        {isManual && (
          <AppText className="mt-3 text-[10px] text-center text-text-muted">
            Valores editados manualmente
          </AppText>
        )}
      </Animated.View>

      {/* Bottom CTA */}
      <Animated.View entering={FadeInDown.delay(200).duration(600)}>
        <Pressable
          accessibilityRole="button"
          className="min-h-[56px] flex-row items-center justify-center gap-3 rounded-2xl bg-brand-primary shadow-lg shadow-brand-primary/30"
          onPress={save}
        >
          <Check color="#FFFFFF" size={20} weight="bold" />
          <AppText className="text-base font-bold text-white">
            Confirmar Registro
          </AppText>
        </Pressable>
      </Animated.View>
    </AppScreen>
  );
}
