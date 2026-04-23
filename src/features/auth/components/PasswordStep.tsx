import { Fingerprint } from 'phosphor-react-native';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, View, TextInput } from 'react-native';

import { AppButton } from '@/src/shared/components/ui/AppButton';
import { AppText } from '@/src/shared/components/ui/AppText';
import { zodResolver } from '@/src/shared/lib/form';

import { passwordSchema } from '../schemas/auth.schemas';
import type { PasswordFormValues } from '../types/auth.types';

type PasswordStepProps = {
  cpf: string;
  isLoading: boolean;
  onBack: () => void;
  onForgotPassword: () => void;
  onSubmit: (values: PasswordFormValues) => void;
};

export function PasswordStep({ cpf, isLoading, onForgotPassword, onSubmit }: PasswordStepProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    defaultValues: { password: '' },
    resolver: zodResolver(passwordSchema),
  });

  return (
    <View className="flex-1 justify-between">
      <View>
        <View className="mb-14">
          <AppText className="font-heading text-4xl font-semibold text-text-main mb-4 leading-tight tracking-tight">
            Bem-vindo de volta.
          </AppText>
          <AppText className="text-text-muted text-base font-sans leading-relaxed">
            Identificamos sua conta. Insira sua senha para continuar.
          </AppText>
        </View>

        <View className="mb-8 border-b-2 border-border-subtle focus:border-brand-primary">
          <Controller
            control={control}
            name="password"
            render={({ field: { onBlur, onChange, value } }) => (
              <TextInput
                autoFocus
                className="py-5 text-2xl text-text-main tracking-widest"
                onBlur={onBlur}
                onChangeText={onChange}
                onSubmitEditing={handleSubmit(onSubmit)}
                placeholder="********"
                placeholderTextColor="var(--color-text-muted)"
                returnKeyType="go"
                secureTextEntry
                value={value}
                selectionColor="#8B5CF6"
                cursorColor="#8B5CF6"
              />
            )}
          />
        </View>
        {errors.password?.message && (
          <AppText className="text-red-500 text-sm mb-4">{errors.password.message}</AppText>
        )}

        <Pressable onPress={onForgotPassword} className="self-start py-1">
           <AppText className="text-brand-primary font-bold text-sm uppercase tracking-widest">Esqueci minha senha</AppText>
        </Pressable>
      </View>

      <View className="pb-10">
        <AppButton 
          loading={isLoading} 
          onPress={handleSubmit(onSubmit)}
          className="bg-brand-primary h-16 rounded-2xl"
          rightIcon={<Fingerprint size={24} color="#FFFFFF" />}
        >
          <AppText className="text-white font-bold text-lg">Entrar no Club</AppText>
        </AppButton>
      </View>
    </View>
  );
}
