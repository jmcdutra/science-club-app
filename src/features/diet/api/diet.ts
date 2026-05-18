import { apiClient } from '@/src/shared/api/apiClient';
import type {
  DietAdherenceResponse,
  DietDayLog,
  DietPlan,
  MacroValues,
} from '../types';

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

export async function getDietAdherence(token: string) {
  return apiClient<DietAdherenceResponse>('/api/student-diets/adherence', { token });
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
  return apiClient<{ ok: boolean }>(`/api/student-diets/meals/${mealId}/consume`, {
    method: 'PUT',
    token,
  });
}

export async function saveDietMealPhoto(
  token: string,
  mealId: string,
  payload: { photoUrl: string; photoName?: string },
) {
  return apiClient<{ ok: boolean }>(`/api/student-diets/meals/${mealId}/photo`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  });
}

export async function skipDietMeal(token: string, mealId: string) {
  return apiClient<{ ok: boolean }>(`/api/student-diets/meals/${mealId}/skip`, { method: 'PUT', token });
}

export async function resetDietMeal(token: string, mealId: string) {
  return apiClient<{ ok: boolean }>(`/api/student-diets/meals/${mealId}/log`, { method: 'DELETE', token });
}

export async function uploadDietMealPhoto(
  token: string,
  uri: string,
  fileMeta?: { name?: string; mimeType?: string },
) {
  const formData = new FormData();
  const filename = fileMeta?.name || uri.split('/').pop() || 'refeicao.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = fileMeta?.mimeType || (match ? `image/${match[1]}` : 'application/octet-stream');

  formData.append('file', {
    uri,
    name: filename,
    type,
  } as any);
  formData.append('folder', 'images/diet-meals');

  return apiClient<{ url: string }>('/api/upload', {
    method: 'POST',
    token,
    body: formData,
  });
}
