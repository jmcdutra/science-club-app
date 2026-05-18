import { Routes } from '@/src/shared/api/routes';

import type { StudentProfile } from '../types';

export const STUDENT_PROFILE_QUERY_KEY = ['student-profile'];

export async function getStudentProfile(token: string) {
  return Routes.get<StudentProfile>('/api/student-profile', { token });
}

export async function updateStudentPersonalData(
  token: string,
  payload: {
    phone: string;
    whatsapp: string;
    cpf: string;
  },
) {
  return Routes.patch<StudentProfile>(
    '/api/student-profile/personal-data',
    payload,
    { token },
  );
}

export async function updateStudentProfilePreferences(
  token: string,
  payload: Partial<StudentProfile['preferences']>,
) {
  return Routes.patch<StudentProfile>(
    '/api/student-profile/preferences',
    payload,
    { token },
  );
}

export async function saveStudentMeasurements(
  token: string,
  payload: {
    weightKg?: number | null;
    heightCm?: number | null;
    bodyFatPercent?: number | null;
  },
) {
  return Routes.post<StudentProfile>(
    '/api/student-profile/measurements',
    payload,
    { token },
  );
}
