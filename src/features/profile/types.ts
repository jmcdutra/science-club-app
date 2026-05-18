export type StudentStatus = 'active' | 'inactive' | 'pending' | 'overdue';

export type ProfilePlan = {
  name: string;
  startDate: string | null;
  renewalDate: string | null;
};

export type ProfileMetrics = {
  workoutsDone: number;
  weeksActive: number;
  adherence: number;
  adherenceBreakdown?: {
    percent: number;
    expectedWorkoutSessions: number;
    completedWorkoutSessions: number;
    expectedDietMeals: number;
    completedDietMeals: number;
  };
};

export type BodySnapshot = {
  age: number | null;
  weightKg: number | null;
  heightCm: number | null;
  bodyFatPercent: number | null;
  updatedAt: string;
};

export type BodyMeasurement = {
  id: string;
  weightKg: number | null;
  heightCm: number | null;
  bodyFatPercent: number | null;
  recordedAt: string;
};

export type ProfileDocument = {
  id: string;
  title: string;
  category: 'contract' | 'plan' | 'exam' | 'terms';
  status: 'available' | 'reviewed' | 'signed' | 'pending';
  date: string;
  description: string;
};

export type ProfilePreferences = {
  workoutReminders: boolean;
  mealReminders: boolean;
  assessmentAlerts: boolean;
  privateProgress: boolean;
  communicationChannel: 'whatsapp' | 'email' | 'app';
  themePreference: 'system' | 'light' | 'dark';
};

export type StudentProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  cpf: string;
  metrics: ProfileMetrics;
  body: BodySnapshot | null;
  documents: ProfileDocument[];
  preferences: ProfilePreferences;
  measurements: BodyMeasurement[];
  plan: ProfilePlan;
  currentWorkout: string;
  currentDiet: string;
};
