import { create } from 'zustand';

import { activeDietPlan } from '../data/dietPlan';
import { initialDietLogs } from '../data/history';
import { DietDayLog, DietFoodSubstitution, DietPlan, FoodLog, MacroValues, MealLog } from '../types';
import { getTodayKey, resolveMealLogStatus, scaleNutrition } from '../utils';

type DietStore = {
  plan: DietPlan;
  selectedDate: string;
  dayLogs: Record<string, DietDayLog>;
  setSelectedDate: (date: string) => void;
  addWater: (amountMl: number) => void;
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
      ? dayLog.mealLogs.map((item) => (item.mealId === mealLog.mealId ? mealLog : item))
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
  setSelectedDate: (date) => set({ selectedDate: date }),
  addWater: (amountMl) =>
    set((state) => {
      const dayLog = state.dayLogs[state.selectedDate] ?? makeEmptyDayLog(state.selectedDate);

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
  logFood: ({ mealId, foodId, actualGrams, replacement, customNutrition }) =>
    set((state) => {
      const meal = state.plan.meals.find((item) => item.id === mealId);
      const food = meal?.foods.find((item) => item.id === foodId);
      if (!meal || !food) return state;

      const source = replacement ?? food;
      const now = new Date().toISOString();
      const dayLog = state.dayLogs[state.selectedDate] ?? makeEmptyDayLog(state.selectedDate);
      const currentMealLog = dayLog.mealLogs.find((item) => item.mealId === mealId);
      const otherFoodLogs = currentMealLog?.foodLogs.filter((item) => item.foodId !== foodId) ?? [];
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
        status: resolveMealLogStatus(meal, nextFoodLogs),
        foodLogs: nextFoodLogs,
        updatedAt: now,
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

      const now = new Date().toISOString();
      const dayLog = state.dayLogs[state.selectedDate] ?? makeEmptyDayLog(state.selectedDate);
      const nextMealLog: MealLog = {
        mealId,
        status: 'done',
        updatedAt: now,
        foodLogs: meal.foods.map((food) => ({
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
      const dayLog = state.dayLogs[state.selectedDate] ?? makeEmptyDayLog(state.selectedDate);
      const nextMealLog: MealLog = {
        mealId,
        status: 'skipped',
        foodLogs: [],
        skippedReason: 'Pulada pelo aluno',
        updatedAt: now,
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
      const dayLog = state.dayLogs[state.selectedDate] ?? makeEmptyDayLog(state.selectedDate);

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
