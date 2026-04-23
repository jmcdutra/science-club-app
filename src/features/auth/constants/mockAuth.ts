import { onlyDigits } from '@/src/shared/utils/cpf';

import type { AuthLookupStatus } from '../types/auth.types';

type MockStudent = {
  cpf: string;
  status: AuthLookupStatus;
  name: string;
};

export const mockStudents: MockStudent[] = [
  {
    cpf: '12345678900',
    name: 'Aluno Science',
    status: 'existing-student',
  },
  {
    cpf: '98765432100',
    name: 'Novo aluno',
    status: 'needs-registration',
  },
];

export function findMockStudent(cpf: string) {
  const digits = onlyDigits(cpf);
  const student = mockStudents.find((item) => item.cpf === digits);

  if (student) {
    return student;
  }

  const lastDigit = Number(digits.at(-1) ?? 0);

  return {
    cpf: digits,
    name: 'Aluno Science',
    status: lastDigit % 2 === 0 ? 'needs-registration' : 'existing-student',
  } satisfies MockStudent;
}
