export type AuthLookupStatus = 'existing-student' | 'needs-registration';

export type AuthSession = {
  token: string;
  studentId: string;
  cpf: string;
};

export type CpfFormValues = {
  cpf: string;
};

export type PasswordFormValues = {
  password: string;
};

export type RegisterFormValues = {
  email: string;
  password: string;
};
