import { apiClient } from '@/src/shared/api/apiClient';

export type RankingMetric =
  | 'workouts_completed'
  | 'total_weight'
  | 'training_minutes'
  | 'consulting_days'
  | 'meals_logged';

export type RankingLevelDTO = {
  xp: number;
  level: number;
  title: string;
  progress: number;
  nextLevelXp: number | null;
};

export type RankingEntryDTO = {
  studentId: string;
  name: string;
  avatarUrl: string | null;
  value: number;
  level: RankingLevelDTO;
  position: number;
};

export type RankingBoardDTO = {
  id: string;
  inviteCode?: string | null;
  title: string;
  description: string;
  metric: RankingMetric;
  metrics?: RankingMetric[];
  metricLabel: string;
  unit: string;
  period: 'all_time' | 'current_month' | 'custom';
  entries: RankingEntryDTO[];
};

export type RankingStudentDTO = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type RankingsOverviewDTO = {
  viewerLevel: RankingLevelDTO;
  publicRankings: RankingBoardDTO[];
  customRankings: RankingBoardDTO[];
};

export type CreateRankingPayload = {
  title: string;
  description?: string;
  metric?: RankingMetric;
  metrics: RankingMetric[];
  period: 'all_time' | 'current_month' | 'custom';
  startDate?: string;
  endDate?: string;
  participantIds: string[];
  visibility?: 'private' | 'public';
};

export async function getRankingsOverview(token: string) {
  return apiClient<RankingsOverviewDTO>('/api/rankings', { token });
}

export async function searchRankingStudents(token: string, search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiClient<RankingStudentDTO[]>(`/api/rankings/students${query}`, { token });
}

export async function createRankingBoard(token: string, payload: CreateRankingPayload) {
  return apiClient<{ id: string; inviteCode?: string | null }>('/api/rankings/boards', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export async function joinRankingByCode(token: string, code: string) {
  return apiClient<{ id: string; inviteCode?: string | null }>('/api/rankings/boards/join', {
    method: 'POST',
    token,
    body: JSON.stringify({ code }),
  });
}
