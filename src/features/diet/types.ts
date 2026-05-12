export type MacroValues = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type NutritionTargets = MacroValues & {
  waterMl: number;
};

export type DietFoodSubstitution = {
  id: string;
  name: string;
  plannedGrams: number;
  displayQuantity: string;
  nutrition: MacroValues;
};

export type DietFood = {
  id: string;
  name: string;
  category: string;
  plannedGrams: number;
  displayQuantity: string;
  nutrition: MacroValues;
  notes?: string;
  substitutions?: DietFoodSubstitution[];
  isExtra?: boolean;
};

export type DietMeal = {
  id: string;
  name: string;
  time: string;
  context: string;
  notes?: string;
  foods: DietFood[];
};

export type DietPlan = {
  id: string;
  name: string;
  objective: string;
  professional: string;
  version: number;
  updatedAt: string;
  targets: NutritionTargets;
  waterGuidance: string;
  supplementGuidance: string;
  generalNotes: string;
  restrictions: string;
  meals: DietMeal[];
};

export type MealStatus = "pending" | "partial" | "done" | "skipped";

export type FoodLog = {
  foodId: string;
  selectedFoodId: string;
  selectedFoodName: string;
  plannedGrams: number;
  actualGrams: number;
  nutrition: MacroValues;
  loggedAt: string;
  replacedBy?: string;
};

export type MealLog = {
  mealId: string;
  status: MealStatus;
  foodLogs: FoodLog[];
  skippedReason?: string;
  updatedAt: string;
  photoUri?: string;
  photoName?: string;
};

export type DietDayLog = {
  date: string;
  waterMl: number;
  mealLogs: MealLog[];
};
