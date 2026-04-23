import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form';
import type { z } from 'zod';

export function zodResolver<TFieldValues extends FieldValues>(
  schema: z.ZodType<TFieldValues>,
): Resolver<TFieldValues> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);

    if (result.success) {
      return {
        values: result.data as TFieldValues,
        errors: {},
      };
    }

    const errors = result.error.issues.reduce<FieldErrors<TFieldValues>>((acc, issue) => {
      const field = issue.path.join('.') as keyof TFieldValues;

      if (field) {
        acc[field] = {
          type: issue.code,
          message: issue.message,
        } as FieldErrors<TFieldValues>[keyof TFieldValues];
      }

      return acc;
    }, {});

    return {
      values: {},
      errors,
    };
  };
}
