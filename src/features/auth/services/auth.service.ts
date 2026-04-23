import { findMockStudent } from '../constants/mockAuth';
import type { AuthSession, CpfFormValues, PasswordFormValues, RegisterFormValues } from '../types/auth.types';

const MOCK_DELAY = 850;

function wait() {
  return new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
}

export async function lookupStudentByCpf(values: CpfFormValues) {
  await wait();
  return findMockStudent(values.cpf);
}

export async function signInWithPassword(cpf: string, values: PasswordFormValues): Promise<AuthSession> {
  await wait();

  return {
    cpf,
    studentId: 'student_mock_existing',
    token: `mock-token:${cpf}:${values.password.length}`,
  };
}

export async function registerAccess(cpf: string, values: RegisterFormValues): Promise<AuthSession> {
  await wait();

  return {
    cpf,
    studentId: 'student_mock_registered',
    token: `mock-token:${cpf}:${values.email}`,
  };
}
