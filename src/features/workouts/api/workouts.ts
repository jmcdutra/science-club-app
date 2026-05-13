import { apiClient } from '@/src/shared/api/apiClient';

export type WorkoutSetDTO = { id: string; reps: string; weight?: string; duration?: string };
export type WorkoutExerciseDTO = {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
  restSeconds: number;
  cue: string;
  description?: string;
  executionTips?: string[];
  videos?: {
    id: string;
    title: string;
    provider: 'own' | 'youtube' | 'reels' | 'tiktok';
    url: string;
    embedUrl?: string;
  }[];
  previous: string;
  sets: WorkoutSetDTO[];
};
export type WorkoutSessionDTO = {
  id: string;
  title: string;
  type: string;
  days: string;
  estimatedMinutes: number;
  muscles: string[];
  exercises: WorkoutExerciseDTO[];
};
export type WorkoutSheetDTO = {
  id: string;
  level: string;
  title: string;
  goal: string;
  coach: string;
  updatedAt: string;
  sessions: WorkoutSessionDTO[];
};

export type WorkoutProgressDTO = {
  _id: string;
  session_id: string;
  completed_sets: Record<string, number>;
  weight_overrides: Record<string, string>;
  reps_overrides: Record<string, string>;
  rest_overrides: Record<string, string>;
  elapsed_seconds: number;
  rest_elapsed_seconds: number;
  rest_left_seconds: number;
  started_at: string | null;
  finished_at: string | null;
};

export async function getCurrentWorkout(token: string) {
  return apiClient<{
    hasAccess?: boolean;
    reason?: 'plan_excludes_training' | 'workout_not_ready' | null;
    whatsappUpgradeUrl?: string;
    workout: WorkoutSheetDTO | null;
    todaySessionId: string | null;
    progressBySession: Record<string, WorkoutProgressDTO>;
  }>(
    '/api/student-workouts/current',
    { token },
  );
}

export async function getSessionProgress(token: string, workoutId: string, sessionId: string) {
  return apiClient<WorkoutProgressDTO | null>(`/api/student-workouts/${workoutId}/progress/${sessionId}`, { token });
}

export async function saveSessionProgress(token: string, workoutId: string, sessionId: string, data: Partial<WorkoutProgressDTO>) {
  return apiClient<WorkoutProgressDTO>(`/api/student-workouts/${workoutId}/progress/${sessionId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(data),
  });
}
