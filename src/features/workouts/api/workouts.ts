import { apiClient } from '@/src/shared/api/apiClient';

export type WorkoutSetDTO = {
  id: string;
  label?: string;
  type?: string;
  reps: string;
  weight?: string;
  restSeconds?: number;
  duration?: string;
};
export type WorkoutExerciseDTO = {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
  restSeconds: number;
  cue: string;
  description?: string;
  executionTips?: string[];
  coverUrl?: string | null;
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

export type WorkoutHistorySetDTO = {
  setId: string;
  label: string;
  plannedWeight: string;
  plannedReps: string;
  performedWeightKg: number;
  performedWeightLabel: string;
  performedReps: number;
  volumeKg: number;
  completed: boolean;
};

export type WorkoutHistoryExerciseDTO = {
  exerciseId: string;
  exerciseName: string;
  completedSets: number;
  plannedSets: number;
  totalVolumeKg: number;
  totalReps: number;
  averageLoadKg: number;
  sets: WorkoutHistorySetDTO[];
};

export type WorkoutSessionHistoryDTO = {
  id: string;
  recordedAt: string | null;
  sessionId: string;
  sessionName: string;
  sessionDay?: string;
  sessionFocus?: string;
  imageUrl?: string;
  observation?: string;
  validSets: number;
  totalReps: number;
  volumeKg: number;
  volume: string;
  durationMinutes: number;
  exercises: WorkoutHistoryExerciseDTO[];
};

export type WorkoutSheetDTO = {
  id: string;
  level: string;
  title: string;
  goal: string;
  coach: string;
  updatedAt: string;
  coverUrl?: string | null;
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
  is_paused?: boolean;
  updated_at?: string | null;
  photo_url?: string;
  photo_name?: string;
  observation?: string;
  rating?: string;
};

export type StudentAppAccessLockDTO = {
  enabled: boolean;
  reason: "pending_evaluation";
  evaluationId: string;
  questionnaireId?: string;
  questionnaireTitle?: string;
  message?: string;
};

export async function getCurrentWorkout(token: string) {
  return apiClient<{
    hasAccess?: boolean;
    reason?: 'plan_excludes_training' | 'workout_not_ready' | null;
    whatsappUpgradeUrl?: string;
    appAccessLock?: StudentAppAccessLockDTO | null;
    workout: WorkoutSheetDTO | null;
    todaySessionId: string | null;
    progressBySession: Record<string, WorkoutProgressDTO>;
    historyBySession: Record<string, WorkoutSessionHistoryDTO[]>;
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

export async function uploadWorkoutProgressPhoto(
  token: string,
  uri: string,
  fileMeta?: { name?: string; mimeType?: string },
) {
  const formData = new FormData();
  const filename = fileMeta?.name || uri.split('/').pop() || 'treino.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = fileMeta?.mimeType || (match ? `image/${match[1]}` : 'application/octet-stream');

  formData.append('file', {
    uri,
    name: filename,
    type,
  } as any);
  formData.append('folder', 'images/workout-records');

  return apiClient<{ url: string }>('/api/upload', {
    method: 'POST',
    token,
    body: formData,
  });
}
