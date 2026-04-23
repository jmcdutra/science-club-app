import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { AppScreen } from '@/src/shared/components/ui/AppScreen';
import { onlyDigits } from '@/src/shared/utils/cpf';

import { CpfStep } from '../components/CpfStep';
import { LoginShell } from '../components/LoginShell';
import { PasswordStep } from '../components/PasswordStep';
import { RegisterStep } from '../components/RegisterStep';
import { lookupStudentByCpf, registerAccess, signInWithPassword } from '../services/auth.service';
import { useAuthStore } from '../services/auth.store';
import type { AuthLookupStatus, CpfFormValues, PasswordFormValues, RegisterFormValues } from '../types/auth.types';

type LoginStep = 'cpf' | AuthLookupStatus;

export function LoginScreen() {
  const [step, setStep] = useState<LoginStep>('cpf');
  const [cpf, setCpf] = useState('');
  const setSession = useAuthStore((state) => state.setSession);

  const copy = useMemo(() => {
    if (step === 'existing-student') {
      return {
        description: 'Informe sua senha para continuar com a experiencia Science Fitness.',
        eyebrow: 'Acesso do aluno',
        title: 'Bem-vindo de volta.',
      };
    }

    if (step === 'needs-registration') {
      return {
        description: 'Complete seu acesso com email e senha para ativar sua área do aluno.',
        eyebrow: 'Primeiro acesso',
        title: 'Finalize seu cadastro.',
      };
    }

    return {
      description: 'Acompanhe treinos, dieta e reavaliações com uma experiência focada em performance.',
      eyebrow: 'Science Fitness',
      title: 'Entre no seu clube.',
    };
  }, [step]);

  const lookupMutation = useMutation({
    mutationFn: lookupStudentByCpf,
    onSuccess: (student, values) => {
      setCpf(values.cpf);
      setStep(student.status);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (values: PasswordFormValues) => signInWithPassword(onlyDigits(cpf), values),
    onSuccess: async (session) => {
      await setSession(session);
      router.replace('/(app)/(tabs)/home');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (values: RegisterFormValues) => registerAccess(onlyDigits(cpf), values),
    onSuccess: async (session) => {
      await setSession(session);
      router.replace('/(app)/(tabs)/home');
    },
  });

  function handleCpfSubmit(values: CpfFormValues) {
    lookupMutation.mutate(values);
  }

  function resetCpf() {
    setStep('cpf');
    setCpf('');
  }

  function forgotPassword() {
    Alert.alert('Recuperacao de senha', 'Fluxo preparado para integracao com a API.');
  }

  return (
    <AppScreen hideGlow={true} contentClassName="min-h-full">
      <LoginShell 
        showBackButton={step !== 'cpf'} 
        onBack={resetCpf}
      >
        {step === 'cpf' ? (
          <CpfStep isLoading={lookupMutation.isPending} onSubmit={handleCpfSubmit} />
        ) : null}

        {step === 'existing-student' ? (
          <PasswordStep
            cpf={cpf}
            isLoading={passwordMutation.isPending}
            onBack={resetCpf}
            onForgotPassword={forgotPassword}
            onSubmit={(values) => passwordMutation.mutate(values)}
          />
        ) : null}

        {step === 'needs-registration' ? (
          <RegisterStep
            cpf={cpf}
            isLoading={registerMutation.isPending}
            onBack={resetCpf}
            onForgotPassword={forgotPassword}
            onSubmit={(values) => registerMutation.mutate(values)}
          />
        ) : null}
      </LoginShell>
    </AppScreen>
  );
}
