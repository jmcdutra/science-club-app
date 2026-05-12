import { Check, Minus, Plus, TrendUp, X } from "phosphor-react-native";
import { Modal, Pressable, ScrollView, TextInput, View } from "react-native";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { AppButton } from "@/src/shared/components/ui/AppButton";
import { AppText } from "@/src/shared/components/ui/AppText";
import { useAuthStore } from "@/src/features/auth/services/auth.store";
import { WorkoutNativeBottomSheet } from "@/src/features/workouts/components/WorkoutNativeBottomSheet";

import { logDietFood } from "../api/diet";
import { useDietStore, useSelectedDietDay } from "../services/diet.store";
import type { DietFood, DietFoodSubstitution } from "../types";
import { formatMacro, getFoodLog, getMealLog, scaleNutrition } from "../utils";

/* ─── Substitutions sheet ────────────────────────────────────────────────── */

function SubstitutionsSheet({
  food,
  onClose,
  onSelect,
  selectedId,
}: {
  food: DietFood;
  onClose: () => void;
  onSelect: (item: DietFoodSubstitution | null) => void;
  selectedId?: string;
}) {
  return (
    <Modal animationType="fade" transparent visible>
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.75)",
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            width: "100%",
            backgroundColor: "#090909",
            borderTopLeftRadius: 38,
            borderTopRightRadius: 38,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 32,
          }}
        >
          {/* Handle */}
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 99,
                backgroundColor: "#222222",
              }}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <AppText className="font-heading text-[20px] font-bold text-white">
              Substituições
            </AppText>
            <Pressable
              onPress={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: 99,
                borderWidth: 1,
                borderColor: "#222222",
                backgroundColor: "#111111",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={14} color="#A1A1AA" weight="bold" />
            </Pressable>
          </View>

          <AppText
            style={{
              fontSize: 12,
              color: "#555555",
              lineHeight: 18,
              marginBottom: 16,
            }}
          >
            Aprovadas pelo seu coach. Macros equivalentes.
          </AppText>

          {food.substitutions?.length ? (
            <>
              {food.substitutions.map((sub) => {
                const isSelected = selectedId === sub.id;
                const nutrition = scaleNutrition(sub, sub.plannedGrams);
                return (
                  <Pressable
                    key={sub.id}
                    onPress={() => {
                      onSelect(sub);
                      onClose();
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 13,
                      marginBottom: 8,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: isSelected ? "#8B5CF6" : "#222222",
                      backgroundColor: isSelected
                        ? "rgba(139,92,246,0.10)"
                        : "#111111",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <AppText
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: "#FFFFFF",
                          marginBottom: 3,
                        }}
                      >
                        {sub.name}
                      </AppText>
                      <AppText style={{ fontSize: 11, color: "#555555" }}>
                        {sub.plannedGrams}g
                      </AppText>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <AppText
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: "#FFFFFF",
                        }}
                      >
                        {nutrition.calories} kcal
                      </AppText>
                      <AppText style={{ fontSize: 10, color: "#555555" }}>
                        P{formatMacro(nutrition.protein, "")}·C
                        {formatMacro(nutrition.carbs, "")}·G
                        {formatMacro(nutrition.fat, "")}
                      </AppText>
                    </View>
                    {isSelected ? (
                      <Check size={16} color="#8B5CF6" weight="bold" />
                    ) : null}
                  </Pressable>
                );
              })}
              {selectedId ? (
                <Pressable
                  onPress={() => {
                    onSelect(null);
                    onClose();
                  }}
                  style={{
                    width: "100%",
                    marginTop: 4,
                    paddingVertical: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "#222222",
                    alignItems: "center",
                  }}
                >
                  <AppText
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: "#555555",
                    }}
                  >
                    Usar alimento original ({food.name})
                  </AppText>
                </Pressable>
              ) : null}
            </>
          ) : (
            <View style={{ paddingVertical: 24 }}>
              <AppText
                style={{ textAlign: "center", fontSize: 13, color: "#555555" }}
              >
                Sem substituições cadastradas para este alimento.
              </AppText>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

/* ─── Main modal ─────────────────────────────────────────────────────────── */

export function DietFoodLogModal({
  food,
  mealId,
  onClose,
}: {
  food: DietFood;
  mealId: string;
  onClose: () => void;
}) {
  const { session } = useAuthStore();
  const queryClient = useQueryClient();
  const logFoodLocal = useDietStore((state) => state.logFood);
  const dayLog = useSelectedDietDay();
  const mealLog = getMealLog(dayLog, mealId);
  const initialLog = getFoodLog(mealLog, food.id);

  const [replacement, setReplacement] = useState<
    DietFoodSubstitution | undefined
  >(food.substitutions?.find((item) => item.id === initialLog?.replacedBy));
  const [showSubs, setShowSubs] = useState(false);
  const [note, setNote] = useState("");

  const source = replacement ?? food;

  const initialNutrition =
    initialLog?.nutrition ?? scaleNutrition(source, source.plannedGrams);
  const [grams, setGrams] = useState(
    String(initialLog?.actualGrams ?? source.plannedGrams),
  );
  const [calories, setCalories] = useState(
    String(Math.round(initialNutrition.calories)),
  );
  const [protein, setProtein] = useState(
    formatMacro(initialNutrition.protein, ""),
  );
  const [carbs, setCarbs] = useState(formatMacro(initialNutrition.carbs, ""));
  const [fat, setFat] = useState(formatMacro(initialNutrition.fat, ""));
  const [isManual, setIsManual] = useState(false);

  useEffect(() => {
    setIsManual(false);
    setGrams(String(initialLog?.actualGrams ?? source.plannedGrams));
    const nextNutrition =
      initialLog?.replacedBy === replacement?.id && initialLog?.nutrition
        ? initialLog.nutrition
        : scaleNutrition(source, source.plannedGrams);
    setCalories(String(Math.round(nextNutrition.calories)));
    setProtein(formatMacro(nextNutrition.protein, ""));
    setCarbs(formatMacro(nextNutrition.carbs, ""));
    setFat(formatMacro(nextNutrition.fat, ""));
  }, [
    replacement,
    source,
    initialLog?.actualGrams,
    initialLog?.nutrition,
    initialLog?.replacedBy,
  ]);

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

  function handleMacroChange(setter: (v: string) => void, value: string) {
    setIsManual(true);
    setter(value);
  }

  function resetToCalculated() {
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

  const presets = [
    { label: "50%", value: Math.round(source.plannedGrams * 0.5) },
    { label: "75%", value: Math.round(source.plannedGrams * 0.75) },
    { label: "100%", value: source.plannedGrams },
    { label: "125%", value: Math.round(source.plannedGrams * 1.25) },
    { label: "150%", value: Math.round(source.plannedGrams * 1.5) },
  ];

  const macroChips = [
    {
      label: "Kcal",
      value: calories,
      setter: setCalories,
      baseline: String(Math.round(source.nutrition.calories)),
      color: "#8B5CF6",
    },
    {
      label: "Prot",
      value: protein,
      setter: setProtein,
      baseline: formatMacro(source.nutrition.protein, ""),
      color: "#38BDF8",
    },
    {
      label: "Carbs",
      value: carbs,
      setter: setCarbs,
      baseline: formatMacro(source.nutrition.carbs, ""),
      color: "#F59E0B",
    },
    {
      label: "Gord",
      value: fat,
      setter: setFat,
      baseline: formatMacro(source.nutrition.fat, ""),
      color: "#FB7185",
    },
  ];

  return (
    <>
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
            {/* ── Food header ── */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 18,
              }}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <AppText
                  className="font-heading"
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    letterSpacing: -0.3,
                    color: "#FFFFFF",
                  }}
                >
                  {replacement?.name ?? food.name}
                </AppText>
                {food.notes ? (
                  <AppText
                    style={{ fontSize: 12, color: "#555555", marginTop: 3 }}
                  >
                    {food.notes}
                  </AppText>
                ) : null}
              </View>
              <Pressable
                onPress={onClose}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 99,
                  borderWidth: 1,
                  borderColor: "#222222",
                  backgroundColor: "#111111",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X color="#A1A1AA" size={14} weight="bold" />
              </Pressable>
            </View>

            {/* ── Macros calculados — toque para editar ── */}
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
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <AppText
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 3.5,
                    color: "#555555",
                  }}
                >
                  Macros calculados
                </AppText>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <AppText style={{ fontSize: 10, color: "#444444" }}>
                    plano: {source.plannedGrams}g
                  </AppText>
                  {isManual && (
                    <Pressable onPress={resetToCalculated}>
                      <AppText
                        style={{
                          fontSize: 10,
                          fontWeight: "700",
                          color: "#A78BFA",
                        }}
                      >
                        Recalcular
                      </AppText>
                    </Pressable>
                  )}
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 8 }}>
                {macroChips.map((chip) => (
                  <View
                    key={chip.label}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      backgroundColor: "#18181B",
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isManual ? chip.color + "55" : "transparent",
                      paddingVertical: 10,
                      paddingHorizontal: 4,
                    }}
                  >
                    <TextInput
                      value={chip.value}
                      onChangeText={(v) => handleMacroChange(chip.setter, v)}
                      keyboardType="decimal-pad"
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: chip.color,
                        textAlign: "center",
                        padding: 0,
                        width: "100%",
                        letterSpacing: -0.5,
                      }}
                    />
                    <AppText
                      style={{
                        fontSize: 9,
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        color: "#555555",
                        marginTop: 2,
                      }}
                    >
                      {chip.label}
                    </AppText>
                    <AppText
                      style={{ fontSize: 9, color: "#3A3A3A", marginTop: 1 }}
                    >
                      /{chip.baseline}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>

            {/* ── Quantidade registrada ── */}
            <View style={{ marginBottom: 16 }}>
              <AppText
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 3.5,
                  color: "#555555",
                  marginBottom: 10,
                }}
              >
                Quantidade registrada
              </AppText>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <Pressable
                  onPress={() =>
                    setGrams(String(Math.max(0, (Number(grams) || 0) - 5)))
                  }
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#222222",
                    backgroundColor: "#111111",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Minus size={16} color="#FFFFFF" weight="bold" />
                </Pressable>

                <View style={{ flex: 1, position: "relative" }}>
                  <TextInput
                    value={grams}
                    onChangeText={setGrams}
                    keyboardType="decimal-pad"
                    style={{
                      width: "100%",
                      backgroundColor: "#111111",
                      borderWidth: 1,
                      borderColor: "#8B5CF6",
                      borderRadius: 12,
                      paddingVertical: 12,
                      paddingLeft: 16,
                      paddingRight: 40,
                      color: "#FFFFFF",
                      fontWeight: "700",
                      fontSize: 20,
                      textAlign: "center",
                    }}
                  />
                  <AppText
                    style={{
                      position: "absolute",
                      right: 14,
                      top: 14,
                      fontSize: 12,
                      color: "#555555",
                      fontWeight: "600",
                    }}
                  >
                    g
                  </AppText>
                </View>

                <Pressable
                  onPress={() => setGrams(String((Number(grams) || 0) + 5))}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#222222",
                    backgroundColor: "#111111",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Plus size={16} color="#FFFFFF" weight="bold" />
                </Pressable>
              </View>

              <View style={{ flexDirection: "row", gap: 6 }}>
                {presets.map((preset) => {
                  const active = Number(grams) === preset.value;
                  return (
                    <Pressable
                      key={preset.label}
                      onPress={() => {
                        setGrams(String(preset.value));
                        setIsManual(false);
                      }}
                      style={{
                        flex: 1,
                        paddingVertical: 7,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: active ? "#8B5CF6" : "#222222",
                        backgroundColor: active
                          ? "rgba(139,92,246,0.12)"
                          : "#111111",
                        alignItems: "center",
                      }}
                    >
                      <AppText
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: active ? "#8B5CF6" : "#555555",
                        }}
                      >
                        {preset.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* ── Observação ── */}
            <View style={{ marginBottom: 16 }}>
              <AppText
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 3.5,
                  color: "#555555",
                  marginBottom: 8,
                }}
              >
                Observação
              </AppText>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Ex: com sal, gelado, marca X…"
                placeholderTextColor="#333333"
                style={{
                  width: "100%",
                  backgroundColor: "#111111",
                  borderWidth: 1,
                  borderColor: "#222222",
                  borderRadius: 12,
                  paddingVertical: 11,
                  paddingHorizontal: 14,
                  color: "#FFFFFF",
                  fontSize: 13,
                }}
              />
            </View>

            {/* ── Substituições ── */}
            {food.substitutions?.length ? (
              <View style={{ marginBottom: 20 }}>
                <Pressable
                  onPress={() => setShowSubs(true)}
                  style={{
                    width: "100%",
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#222222",
                    backgroundColor: "#111111",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <TrendUp size={14} color="#555555" weight="bold" />
                  <AppText
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: "#555555",
                    }}
                  >
                    Substituições ({food.substitutions.length})
                  </AppText>
                  {replacement && (
                    <View
                      style={{
                        backgroundColor: "rgba(251,191,36,0.12)",
                        borderRadius: 99,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                      }}
                    >
                      <AppText
                        style={{
                          fontSize: 9,
                          fontWeight: "700",
                          color: "#FBBF24",
                        }}
                      >
                        ATIVO
                      </AppText>
                    </View>
                  )}
                </Pressable>
              </View>
            ) : null}
          </ScrollView>

          {/* ── Save footer ── */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 10,
              paddingBottom: 18,
              borderTopWidth: 1,
              borderTopColor: "#1A1A1A",
            }}
          >
            <AppButton
              fullWidth
              leftIcon={<Check size={16} color="#FFFFFF" weight="bold" />}
              onPress={save}
            >
              {`Registrar ${grams}g — ${calories} kcal`}
            </AppButton>
          </View>
        </View>
      </WorkoutNativeBottomSheet>

      {showSubs ? (
        <SubstitutionsSheet
          food={food}
          onClose={() => setShowSubs(false)}
          onSelect={(item) => {
            setReplacement(item ?? undefined);
            if (item) setGrams(String(item.plannedGrams));
            else setGrams(String(food.plannedGrams));
            setIsManual(false);
          }}
          selectedId={replacement?.id}
        />
      ) : null}
    </>
  );
}
