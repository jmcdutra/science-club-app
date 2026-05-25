import { apiClient } from '@/src/shared/api/apiClient';
import type { CardioActivityDTO, CardioSummaryDTO, ActiveCardioSession } from '../types';

function toFiniteNumber(value: number, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

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
  const routeCoordinates = session.coords
    .filter((coord) => Number.isFinite(coord.lat) && Number.isFinite(coord.lng))
    .filter((_, i) => i % 3 === 0);

  return apiClient<CardioActivityDTO>('/api/cardio', {
    method: 'POST',
    token,
    body: JSON.stringify({
      type: session.type.id,
      started_at: session.startedAt,
      finished_at: session.finishedAt,
      elapsed_seconds: Math.max(0, Math.round(toFiniteNumber(session.elapsed))),
      paused_seconds: Math.max(0, Math.round(toFiniteNumber(session.pausedSeconds))),
      distance_km: Math.max(0, toFiniteNumber(session.distanceKm)),
      calories: Math.max(0, Math.round(toFiniteNumber(session.calories))),
      avg_pace: session.avgPace,
      avg_speed_kmh: Math.max(0, toFiniteNumber(session.avgSpeedKmh)),
      avg_hr: Math.max(0, Math.round(toFiniteNumber(session.avgHr))),
      max_hr: Math.max(0, Math.round(toFiniteNumber(session.maxHr))),
      steps: Math.max(0, Math.round(toFiniteNumber(session.steps))),
      effort: session.effort,
      notes: session.notes,
      route_coordinates: routeCoordinates,
    }),
  });
}

export async function updateCardioActivity(
  token: string,
  activityId: string,
  payload: { effort: ActiveCardioSession['effort']; notes: string },
) {
  return apiClient<CardioActivityDTO>(`/api/cardio/${activityId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export async function deleteCardioActivity(token: string, activityId: string) {
  return apiClient<{ success: boolean }>(`/api/cardio/${activityId}`, {
    method: 'DELETE',
    token,
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
