import { create } from "zustand";

import { activeDietPlan } from "../data/dietPlan";
import { initialDietLogs } from "../data/history";
import {
  DietDayLog,
  DietFood,
  DietFoodSubstitution,
  DietPlan,
  FoodLog,
  MacroValues,
  MealLog,
} from "../types";
import { getTodayKey, resolveMealLogStatus, scaleNutrition } from "../utils";

type DietStore = {
  plan: DietPlan;
  selectedDate: string;
  dayLogs: Record<string, DietDayLog>;
  mealExtrasByDate: Record<string, Record<string, DietFood[]>>;
  setRemoteData: (plan: DietPlan, dayLog: DietDayLog) => void;
  setSelectedDate: (date: string) => void;
  addWater: (amountMl: number) => void;
  setMealPhoto: (
    mealId: string,
    payload: { photoUri?: string; photoName?: string; observation?: string },
  ) => void;
  addExtraFood: (mealId: string, food: DietFood) => void;
  logFood: (payload: {
    mealId: string;
    foodId: string;
    actualGrams: number;
    replacement?: DietFoodSubstitution;
    customNutrition?: MacroValues;
  }) => void;
  markMealConsumed: (mealId: string) => void;
  skipMeal: (mealId: string) => void;
  resetMeal: (mealId: string) => void;
};

function makeEmptyDayLog(date: string): DietDayLog {
  return {
    date,
    waterMl: 0,
    mealLogs: [],
  };
}

function upsertMealLog(dayLog: DietDayLog, mealLog: MealLog): DietDayLog {
  const exists = dayLog.mealLogs.some((item) => item.mealId === mealLog.mealId);

  return {
    ...dayLog,
    mealLogs: exists
      ? dayLog.mealLogs.map((item) =>
          item.mealId === mealLog.mealId ? mealLog : item,
        )
      : [...dayLog.mealLogs, mealLog],
  };
}

export const useDietStore = create<DietStore>((set, get) => ({
  plan: activeDietPlan,
  selectedDate: getTodayKey(),
  dayLogs: {
    ...initialDietLogs,
    [getTodayKey()]: makeEmptyDayLog(getTodayKey()),
  },
  mealExtrasByDate: {},
  setRemoteData: (plan, dayLog) =>
    set((state) => ({
      plan,
      dayLogs: {
        ...state.dayLogs,
        [dayLog.date]: dayLog,
      },
      selectedDate: dayLog.date,
    })),
  setSelectedDate: (date) => set({ selectedDate: date }),
  addWater: (amountMl) =>
    set((state) => {
      const dayLog =
        state.dayLogs[state.selectedDate] ??
        makeEmptyDayLog(state.selectedDate);

      return {
        dayLogs: {
          ...state.dayLogs,
          [state.selectedDate]: {
            ...dayLog,
            waterMl: Math.max(0, dayLog.waterMl + amountMl),
          },
        },
      };
    }),
  setMealPhoto: (mealId, payload) =>
    set((state) => {
      const dayLog =
        state.dayLogs[state.selectedDate] ??
        makeEmptyDayLog(state.selectedDate);
      const currentMealLog = dayLog.mealLogs.find(
        (item) => item.mealId === mealId,
      );
      const nextMealLog: MealLog = {
        mealId,
        status: currentMealLog?.status ?? "partial",
        foodLogs: currentMealLog?.foodLogs ?? [],
        skippedReason: currentMealLog?.skippedReason,
        updatedAt: new Date().toISOString(),
        photoUrl: currentMealLog?.photoUrl,
        photoUri: payload.photoUri ?? currentMealLog?.photoUri,
        photoName: payload.photoName ?? currentMealLog?.photoName,
        observation: payload.observation ?? currentMealLog?.observation,
      };

      return {
        dayLogs: {
          ...state.dayLogs,
          [state.selectedDate]: upsertMealLog(dayLog, nextMealLog),
        },
      };
    }),
  addExtraFood: (mealId, food) =>
    set((state) => ({
      mealExtrasByDate: {
        ...state.mealExtrasByDate,
        [state.selectedDate]: {
          ...state.mealExtrasByDate[state.selectedDate],
          [mealId]: [
            ...(state.mealExtrasByDate[state.selectedDate]?.[mealId] ?? []),
            food,
          ],
        },
      },
    })),
  logFood: ({ mealId, foodId, actualGrams, replacement, customNutrition }) =>
    set((state) => {
      const meal = state.plan.meals.find((item) => item.id === mealId);
      const extraFoods =
        state.mealExtrasByDate[state.selectedDate]?.[mealId] ?? [];
      const mergedMeal = meal
        ? {
            ...meal,
            foods: [...meal.foods, ...extraFoods],
          }
        : null;
      const food =
        meal?.foods.find((item) => item.id === foodId) ??
        extraFoods.find((item) => item.id === foodId);
      if (!meal || !mergedMeal || !food) return state;

      const source = replacement ?? food;
      const now = new Date().toISOString();
      const dayLog =
        state.dayLogs[state.selectedDate] ??
        makeEmptyDayLog(state.selectedDate);
      const currentMealLog = dayLog.mealLogs.find(
        (item) => item.mealId === mealId,
      );
      const otherFoodLogs =
        currentMealLog?.foodLogs.filter((item) => item.foodId !== foodId) ?? [];
      const foodLog: FoodLog = {
        foodId,
        selectedFoodId: source.id,
        selectedFoodName: source.name,
        plannedGrams: source.plannedGrams,
        actualGrams,
        nutrition: customNutrition ?? scaleNutrition(source, actualGrams),
        loggedAt: now,
        replacedBy: replacement?.id,
      };
      const nextFoodLogs = [...otherFoodLogs, foodLog];
      const nextMealLog: MealLog = {
        mealId,
        status: resolveMealLogStatus(mergedMeal, nextFoodLogs),
        foodLogs: nextFoodLogs,
        updatedAt: now,
        photoUrl: currentMealLog?.photoUrl,
        photoUri: currentMealLog?.photoUri,
        photoName: currentMealLog?.photoName,
        observation: currentMealLog?.observation,
      };

      return {
        dayLogs: {
          ...state.dayLogs,
          [state.selectedDate]: upsertMealLog(dayLog, nextMealLog),
        },
      };
    }),
  markMealConsumed: (mealId) =>
    set((state) => {
      const meal = state.plan.meals.find((item) => item.id === mealId);
      if (!meal) return state;
      const extraFoods =
        state.mealExtrasByDate[state.selectedDate]?.[mealId] ?? [];
      const foods = [...meal.foods, ...extraFoods];

      const now = new Date().toISOString();
      const dayLog =
        state.dayLogs[state.selectedDate] ??
        makeEmptyDayLog(state.selectedDate);
      const nextMealLog: MealLog = {
        mealId,
        status: "done",
        updatedAt: now,
        photoUrl: dayLog.mealLogs.find((item) => item.mealId === mealId)
          ?.photoUrl,
        photoUri: dayLog.mealLogs.find((item) => item.mealId === mealId)
          ?.photoUri,
        photoName: dayLog.mealLogs.find((item) => item.mealId === mealId)
          ?.photoName,
        observation: dayLog.mealLogs.find((item) => item.mealId === mealId)
          ?.observation,
        foodLogs: foods.map((food) => ({
          foodId: food.id,
          selectedFoodId: food.id,
          selectedFoodName: food.name,
          plannedGrams: food.plannedGrams,
          actualGrams: food.plannedGrams,
          nutrition: food.nutrition,
          loggedAt: now,
        })),
      };

      return {
        dayLogs: {
          ...state.dayLogs,
          [state.selectedDate]: upsertMealLog(dayLog, nextMealLog),
        },
      };
    }),
  skipMeal: (mealId) =>
    set((state) => {
      const now = new Date().toISOString();
      const dayLog =
        state.dayLogs[state.selectedDate] ??
        makeEmptyDayLog(state.selectedDate);
      const nextMealLog: MealLog = {
        mealId,
        status: "skipped",
        foodLogs: [],
        skippedReason: "Pulada pelo aluno",
        updatedAt: now,
        photoUrl: dayLog.mealLogs.find((item) => item.mealId === mealId)
          ?.photoUrl,
        photoUri: dayLog.mealLogs.find((item) => item.mealId === mealId)
          ?.photoUri,
        photoName: dayLog.mealLogs.find((item) => item.mealId === mealId)
          ?.photoName,
        observation: dayLog.mealLogs.find((item) => item.mealId === mealId)
          ?.observation,
      };

      return {
        dayLogs: {
          ...state.dayLogs,
          [state.selectedDate]: upsertMealLog(dayLog, nextMealLog),
        },
      };
    }),
  resetMeal: (mealId) =>
    set((state) => {
      const dayLog =
        state.dayLogs[state.selectedDate] ??
        makeEmptyDayLog(state.selectedDate);

      return {
        dayLogs: {
          ...state.dayLogs,
          [state.selectedDate]: {
            ...dayLog,
            mealLogs: dayLog.mealLogs.filter((item) => item.mealId !== mealId),
          },
        },
      };
    }),
}));

export function useSelectedDietDay() {
  const selectedDate = useDietStore((state) => state.selectedDate);
  const dayLogs = useDietStore((state) => state.dayLogs);

  return dayLogs[selectedDate] ?? makeEmptyDayLog(selectedDate);
}

export function getDietDayLogSnapshot(date?: string) {
  const { dayLogs, selectedDate } = useDietStore.getState();
  const targetDate = date ?? selectedDate;
  return dayLogs[targetDate] ?? makeEmptyDayLog(targetDate);
}
