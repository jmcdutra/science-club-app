import { Controller, useForm } from 'react-hook-form';
import { View, TextInput } from 'react-native';

import { AppButton } from '@/src/shared/components/ui/AppButton';
import { AppText } from '@/src/shared/components/ui/AppText';
import { zodResolver } from '@/src/shared/lib/form';
import { formatCpf } from '@/src/shared/utils/cpf';

import { cpfSchema } from '../schemas/auth.schemas';
import type { CpfFormValues } from '../types/auth.types';

type CpfStepProps = {
  isLoading: boolean;
  onSubmit: (values: CpfFormValues) => void;
};

export function CpfStep({ isLoading, onSubmit }: CpfStepProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CpfFormValues>({
    defaultValues: { cpf: '' },
    resolver: zodResolver(cpfSchema),
  });

  return (
    <View className="flex-1 justify-between">
      <View>
        <View className="mb-12">
          <AppText className="font-heading text-4xl font-semibold text-text-main mb-4 leading-tight tracking-tight">
            Seja bem-vindo ao clube!
          </AppText>
          <AppText className="text-text-muted text-base font-sans leading-relaxed">
            Insira o seu CPF para acessar o Science Club.
          </AppText>
        </View>

        <View className="mb-8 border-b-2 border-border-subtle focus:border-brand-primary">
          <Controller
            control={control}
            name="cpf"
            render={({ field: { onBlur, onChange, value } }) => (
              <TextInput
                autoComplete="cc-number"
                keyboardType="number-pad"
                maxLength={14}
                onBlur={onBlur}
                onChangeText={(text) => onChange(formatCpf(text))}
                placeholder="000.000.000-00"
                placeholderTextColor="var(--color-text-muted)"
                className="py-5 text-4xl font-mono text-text-main tracking-widest"
                returnKeyType="done"
                textContentType="username"
                value={value}
                selectionColor="#8B5CF6"
                cursorColor="#8B5CF6"
              />
            )}
          />
        </View>
        {errors.cpf?.message && (
          <AppText className="text-red-500 text-sm mb-4">{errors.cpf.message}</AppText>
        )}
      </View>

      <View className="pb-10">
        <AppButton
          fullWidth
          loading={isLoading}
          onPress={handleSubmit(onSubmit)}
        >
          <AppText style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15 }}>Continuar</AppText>
        </AppButton>
      </View>
    </View>
  );
}
