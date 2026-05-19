import { apiClient } from '@/src/shared/api/apiClient';
import type { CardioActivityDTO, CardioSummaryDTO, ActiveCardioSession } from '../types';

export async function getCardioActivities(token: string, params?: { limit?: number; skip?: number; type?: string }) {
  const q = new URLSearchParams();
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.skip) q.set('skip', String(params.skip));
  if (params?.type) q.set('type', params.type);
  const qs = q.toString();
  return apiClient<{ activities: CardioActivityDTO[]; total: number; skip: number; limit: number }>(
    `/api/cardio${qs ? `?${qs}` : ''}`,
    { token },
  );
}

export async function getCardioSummary(token: string) {
  return apiClient<CardioSummaryDTO>('/api/cardio/summary', { token });
}

export async function saveCardioActivity(token: string, session: ActiveCardioSession) {
  return apiClient<CardioActivityDTO>('/api/cardio', {
    method: 'POST',
    token,
    body: JSON.stringify({
      type: session.type.id,
      started_at: session.startedAt,
      finished_at: session.finishedAt,
      elapsed_seconds: session.elapsed,
      distance_km: session.distanceKm,
      calories: session.calories,
      avg_pace: session.avgPace,
      avg_speed_kmh: session.avgSpeedKmh,
      avg_hr: session.avgHr,
      max_hr: session.maxHr,
      steps: session.steps,
      effort: session.effort,
      notes: session.notes,
      route_coordinates: session.coords.filter((_, i) => i % 3 === 0),
    }),
  });
}

// Admin: ver atividades de um aluno
export async function getStudentCardioActivities(token: string, studentId: string, params?: { limit?: number; type?: string }) {
  const q = new URLSearchParams();
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.type) q.set('type', params.type);
  const qs = q.toString();
  return apiClient<{ activities: CardioActivityDTO[]; total: number }>(
    `/api/cardio/admin/students/${studentId}${qs ? `?${qs}` : ''}`,
    { token },
  );
}
