import { z } from 'zod';

import { isValidCpfLength } from '@/src/shared/utils/cpf';

export const cpfSchema = z.object({
  cpf: z.string().refine(isValidCpfLength, 'Informe um CPF com 11 digitos.'),
});

export const passwordSchema = z.object({
  password: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres.'),
});

export const registerSchema = z.object({
  email: z.string().email('Informe um email valido.'),
  password: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres.'),
});
