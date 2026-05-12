import { UserPlus } from 'phosphor-react-native';
import { Controller, useForm } from 'react-hook-form';
import { View, TextInput } from 'react-native';

import { AppButton } from '@/src/shared/components/ui/AppButton';
import { AppText } from '@/src/shared/components/ui/AppText';
import { zodResolver } from '@/src/shared/lib/form';

import { registerSchema } from '../schemas/auth.schemas';
import type { RegisterFormValues } from '../types/auth.types';

type RegisterStepProps = {
  cpf: string;
  email?: string;
  isLoading: boolean;
  onBack: () => void;
  onForgotPassword: () => void;
  onSubmit: (values: RegisterFormValues) => void;
};

export function RegisterStep({ cpf, email, isLoading, onSubmit }: RegisterStepProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    defaultValues: { email: email || '', password: '' },
    resolver: zodResolver(registerSchema),
  });

  const hasPrefilledEmail = !!email;

  return (
    <View className="flex-1 justify-between">
      <View>
        <View className="mb-14">
          <AppText className="font-heading text-4xl font-semibold text-text-main mb-4 leading-tight tracking-tight">
            Complete seu cadastro.
          </AppText>
          <AppText className="text-text-muted text-base font-sans leading-relaxed">
            Seja muito bem-vindo! No seu primeiro acesso, precisamos de alguns dados para continuar.
          </AppText>
        </View>

        <View className="gap-10">
          <View>
            <AppText className="ml-1 opacity-60 uppercase tracking-[0.2em] text-[10px] font-bold text-text-muted mb-1">
              E-mail para Acesso
            </AppText>
            <View className="border-b-2 border-border-subtle focus:border-brand-primary">
              <Controller
                control={control}
                name="email"
                render={({ field: { onBlur, onChange, value } }) => (
                  <TextInput
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    className="py-4 text-xl text-text-main font-sans"
                    keyboardType="email-address"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="seu@email.com"
                    placeholderTextColor="var(--color-text-muted)"
                    value={value}
                    editable={!hasPrefilledEmail}
                    selectionColor="#8B5CF6"
                    cursorColor="#8B5CF6"
                    style={hasPrefilledEmail ? { opacity: 0.6 } : undefined}
                  />
                )}
              />
            </View>
            {errors.email?.message && (
              <AppText className="text-red-500 text-xs mt-1">{errors.email.message}</AppText>
            )}
          </View>

          <View>
            <AppText className="ml-1 opacity-60 uppercase tracking-[0.2em] text-[10px] font-bold text-text-muted mb-1">
              Nova Senha
            </AppText>
            <View className="border-b-2 border-border-subtle focus:border-brand-primary">
              <Controller
                control={control}
                name="password"
                render={({ field: { onBlur, onChange, value } }) => (
                  <TextInput
                    className="py-4 text-xl text-text-main tracking-widest"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="********"
                    placeholderTextColor="var(--color-text-muted)"
                    secureTextEntry
                    value={value}
                    selectionColor="#8B5CF6"
                    cursorColor="#8B5CF6"
                  />
                )}
              />
            </View>
            {errors.password?.message && (
              <AppText className="text-red-500 text-xs mt-1">{errors.password.message}</AppText>
            )}
          </View>
        </View>
      </View>

      <View className="pb-10">
        <AppButton
          fullWidth
          loading={isLoading}
          onPress={handleSubmit(onSubmit)}
          rightIcon={<UserPlus size={18} color="#FFFFFF" />}
        >
          <AppText style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15 }}>Criar Minha Conta</AppText>
        </AppButton>
      </View>
    </View>
  );
}
