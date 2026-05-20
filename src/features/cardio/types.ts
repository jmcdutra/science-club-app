export type CardioActivityType = 'corrida' | 'caminhada' | 'bike' | 'hiit' | 'natacao';

export type CardioEffort = 'easy' | 'good' | 'hard' | 'max';

export type CardioIconName = 'run' | 'walk' | 'bike' | 'hiit' | 'swim';

export interface CardioTypeConfig {
  id: CardioActivityType;
  label: string;
  icon: CardioIconName;
  color: string;
  rgb: string;
  primaryMetricLabel: string;
  speedLabel: string;
}

export const CARDIO_TYPES: CardioTypeConfig[] = [
  { id: 'corrida',   label: 'Corrida',   icon: 'run',  color: '#8B5CF6', rgb: '139,92,246',  primaryMetricLabel: 'QUILÔMETROS', speedLabel: 'Pace' },
  { id: 'caminhada', label: 'Caminhada', icon: 'walk', color: '#22C55E', rgb: '34,197,94',   primaryMetricLabel: 'QUILÔMETROS', speedLabel: 'Pace' },
  { id: 'bike',      label: 'Ciclismo',  icon: 'bike', color: '#38BDF8', rgb: '56,189,248',  primaryMetricLabel: 'QUILÔMETROS', speedLabel: 'Velocidade' },
];

export interface Coordinate {
  lat: number;
  lng: number;
  altitude?: number | null;
  timestamp?: string | null;
}

export interface CardioActivityDTO {
  _id: string;
  student_id: string;
  type: CardioActivityType;
  started_at: string;
  finished_at: string | null;
  elapsed_seconds: number;
  paused_seconds?: number;
  distance_km: number;
  calories: number;
  avg_pace: string;
  avg_speed_kmh: number;
  avg_hr: number;
  max_hr: number;
  steps: number;
  effort: CardioEffort | null;
  notes: string;
  created_at: string;
}

export interface CardioSummaryDTO {
  week: {
    km: number;
    seconds: number;
    kcal: number;
    count: number;
  };
  prs: {
    bestPace: { label: string; val: string; date: string } | null;
    longestDistance: { label: string; val: string; date: string } | null;
    streak: { label: string; val: string; date: string } | null;
  };
  goal_km: number;
}

export interface ActiveCardioSession {
  type: CardioTypeConfig;
  coords: Coordinate[];
  elapsed: number;
  pausedSeconds: number;
  distanceKm: number;
  calories: number;
  avgPace: string;
  avgSpeedKmh: number;
  avgHr: number;
  maxHr: number;
  steps: number;
  startedAt: string;
  finishedAt: string;
  effort: CardioEffort | null;
  notes: string;
}
