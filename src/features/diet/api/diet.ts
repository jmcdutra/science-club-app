import { apiClient } from '@/src/shared/api/apiClient';
import type { DietDayLog, DietPlan, MacroValues } from '../types';

export type StudentDietCurrentResponse = {
  hasAccess: boolean;
  reason: 'plan_excludes_diet' | 'diet_not_ready' | null;
  whatsappUpgradeUrl?: string;
  diet: DietPlan | null;
  dayLog: DietDayLog | null;
};

export async function getCurrentDiet(token: string) {
  return apiClient<StudentDietCurrentResponse>('/api/student-diets/current', { token });
}

export async function updateDietWater(token: string, amountMl: number) {
  return apiClient<{ date: string; waterMl: number }>('/api/student-diets/water', {
    method: 'PUT',
    token,
    body: JSON.stringify({ amountMl }),
  });
}

export async function logDietFood(
  token: string,
  mealId: string,
  payload: {
    foodId: string;
    actualGrams: number;
    replacementId?: string;
    customNutrition?: MacroValues;
  },
) {
  return apiClient<{ ok: boolean }>(`/api/student-diets/meals/${mealId}/log`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  });
}

export async function consumeDietMeal(token: string, mealId: string) {
  return apiClient<{ ok: boolean }>(`/api/student-diets/meals/${mealId}/consume`, { method: 'PUT', token });
}

export async function skipDietMeal(token: string, mealId: string) {
  return apiClient<{ ok: boolean }>(`/api/student-diets/meals/${mealId}/skip`, { method: 'PUT', token });
}

export async function resetDietMeal(token: string, mealId: string) {
  return apiClient<{ ok: boolean }>(`/api/student-diets/meals/${mealId}/log`, { method: 'DELETE', token });
}

