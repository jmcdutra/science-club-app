import {
  DietDayLog,
  DietFood,
  DietFoodSubstitution,
  DietMeal,
  DietPlan,
  FoodLog,
  MacroValues,
  MealLog,
  MealStatus,
} from './types';

export const emptyMacros: MacroValues = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
};

export function getTodayKey() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
  }).format(new Date());
}

export function formatShortDate(dateKey: string) {
  const [, month, day] = dateKey.split('-');
  return `${day}/${month}`;
}

export function formatMacro(value: number, suffix = 'g') {
  return `${Math.round(value)}${suffix}`;
}

export function sumMacros(items: MacroValues[]) {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    emptyMacros,
  );
}

export function scaleNutrition(source: DietFood | DietFoodSubstitution, actualGrams: number): MacroValues {
  const ratio = source.plannedGrams > 0 ? actualGrams / source.plannedGrams : 0;

  return {
    calories: Math.round(source.nutrition.calories * ratio),
    protein: Math.round(source.nutrition.protein * ratio),
    carbs: Math.round(source.nutrition.carbs * ratio),
    fat: Math.round(source.nutrition.fat * ratio),
  };
}

export function getMealTotal(meal: DietMeal) {
  return sumMacros(meal.foods.map((food) => food.nutrition));
}

export function getPlanTotal(plan: DietPlan) {
  return sumMacros(plan.meals.map(getMealTotal));
}

export function getMealLog(dayLog: DietDayLog | undefined, mealId: string) {
  return dayLog?.mealLogs.find((mealLog) => mealLog.mealId === mealId);
}

export function getFoodLog(mealLog: MealLog | undefined, foodId: string) {
  return mealLog?.foodLogs.find((foodLog) => foodLog.foodId === foodId);
}

export function getMealStatus(meal: DietMeal, mealLog: MealLog | undefined): MealStatus {
  if (!mealLog) return 'pending';
  if (mealLog.status === 'skipped') return 'skipped';
  if (mealLog.foodLogs.length === 0) return 'pending';
  if (mealLog.foodLogs.length >= meal.foods.length && mealLog.status === 'done') return 'done';
  return 'partial';
}

export function resolveMealLogStatus(meal: DietMeal, foodLogs: FoodLog[]): MealStatus {
  if (foodLogs.length === 0) return 'pending';
  if (foodLogs.length < meal.foods.length) return 'partial';

  const allPlannedAmounts = meal.foods.every((food) => {
    const log = foodLogs.find((item) => item.foodId === food.id);
    return log && Math.abs(log.actualGrams - log.plannedGrams) <= 2 && !log.replacedBy;
  });

  return allPlannedAmounts ? 'done' : 'partial';
}

export function getConsumedMacros(dayLog: DietDayLog | undefined) {
  return sumMacros(dayLog?.mealLogs.flatMap((mealLog) => mealLog.foodLogs.map((foodLog) => foodLog.nutrition)) ?? []);
}

export function getMealConsumedMacros(mealLog: MealLog | undefined) {
  return sumMacros(mealLog?.foodLogs.map((foodLog) => foodLog.nutrition) ?? []);
}

export function getAdherence(plan: DietPlan, dayLog: DietDayLog | undefined) {
  if (!dayLog) return 0;

  const score = plan.meals.reduce((acc, meal) => {
    const status = getMealStatus(meal, getMealLog(dayLog, meal.id));
    if (status === 'done') return acc + 1;
    if (status === 'partial') return acc + 0.55;
    return acc;
  }, 0);

  return Math.round((score / plan.meals.length) * 100);
}

export function getNextMeal(plan: DietPlan, dayLog: DietDayLog | undefined) {
  return plan.meals.find((meal) => {
    const status = getMealStatus(meal, getMealLog(dayLog, meal.id));
    return status === 'pending' || status === 'partial';
  }) ?? plan.meals[plan.meals.length - 1];
}

export function getStatusLabel(status: MealStatus) {
  const labels: Record<MealStatus, string> = {
    pending: 'Pendente',
    partial: 'Parcial',
    done: 'Concluida',
    skipped: 'Pulada',
  };

  return labels[status];
}

export function getProgressPercent(value: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((value / target) * 100));
}
