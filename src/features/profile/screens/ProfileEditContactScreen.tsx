import { ArrowLeft, CheckCircle, IdentificationCard, Phone } from 'phosphor-react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppButton } from '@/src/shared/components/ui/AppButton';
import { AppText } from '@/src/shared/components/ui/AppText';
import { useAppTheme } from '@/src/shared/theme/appTheme';
import { useAuthStore } from '@/src/features/auth/services/auth.store';
import {
  STUDENT_PROFILE_QUERY_KEY,
  getStudentProfile,
  updateStudentPersonalData,
} from '../api/profile';

export function ProfileEditContactScreen() {
  const { isDark } = useAppTheme();
  const { session } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: STUDENT_PROFILE_QUERY_KEY,
    queryFn: () => getStudentProfile(session?.token!),
    enabled: !!session?.token,
  });
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cpf, setCpf] = useState('');

  useEffect(() => {
    if (!profile) return;
    setPhone(profile.phone || '');
    setWhatsapp(profile.whatsapp || '');
    setCpf(profile.cpf || '');
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateStudentPersonalData(session?.token!, {
        phone,
        whatsapp,
        cpf,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: STUDENT_PROFILE_QUERY_KEY });
      router.back();
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#FFFFFF' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 16,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 99,
              backgroundColor: isDark ? '#111111' : '#F9FAFB',
              borderWidth: 1,
              borderColor: isDark ? '#222222' : '#E5E7EB',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft
              color={isDark ? '#FFFFFF' : '#111827'}
              size={20}
              weight="bold"
            />
          </Pressable>
          <AppText
            className="font-heading"
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: isDark ? '#FFFFFF' : '#111827',
              marginLeft: 16,
            }}
          >
            Dados Pessoais
          </AppText>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View entering={FadeInDown.duration(420)}>
              <AppText
                style={{
                  fontSize: 14,
                  color: isDark ? '#888888' : '#6B7280',
                  marginBottom: 32,
                  lineHeight: 22,
                }}
              >
                Mantenha seus dados atualizados para que a equipe consiga falar
                com você sempre que necessário.
              </AppText>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).duration(420)}>
              <InputField
                icon={<Phone color={isDark ? '#888888' : '#6B7280'} size={20} weight="fill" />}
                isDark={isDark}
                label="Telefone"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="(00) 00000-0000"
              />

              <InputField
                icon={<Phone color={isDark ? '#888888' : '#6B7280'} size={20} weight="fill" />}
                isDark={isDark}
                label="WhatsApp"
                value={whatsapp}
                onChangeText={setWhatsapp}
                keyboardType="phone-pad"
                placeholder="(00) 00000-0000"
              />

              <InputField
                icon={
                  <IdentificationCard
                    color={isDark ? '#888888' : '#6B7280'}
                    size={20}
                    weight="fill"
                  />
                }
                isDark={isDark}
                label="CPF"
                value={cpf}
                onChangeText={setCpf}
                keyboardType="numeric"
                placeholder="000.000.000-00"
              />

              <View style={{ marginTop: 8 }}>
                <AppButton
                  onPress={() => saveMutation.mutate()}
                  leftIcon={<CheckCircle color="#FFFFFF" size={18} weight="bold" />}
                  fullWidth
                >
                  {saveMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </AppButton>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function InputField({
  icon,
  isDark,
  label,
  value,
  onChangeText,
  keyboardType,
  placeholder,
}: {
  icon: React.ReactNode;
  isDark: boolean;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType: 'default' | 'phone-pad' | 'numeric';
  placeholder: string;
}) {
  return (
    <View style={{ marginBottom: 24 }}>
      <AppText
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: isDark ? '#FFFFFF' : '#111827',
          marginBottom: 8,
          marginLeft: 4,
        }}
      >
        {label}
      </AppText>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: isDark ? '#111111' : '#F9FAFB',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: isDark ? '#222222' : '#E5E7EB',
          paddingHorizontal: 16,
          height: 56,
        }}
      >
        {icon}
        <TextInput
          style={{
            flex: 1,
            marginLeft: 12,
            fontSize: 16,
            color: isDark ? '#FFFFFF' : '#111827',
            fontFamily: 'Inter',
          }}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#555555' : '#9CA3AF'}
          value={value}
          onChangeText={onChangeText}
        />
      </View>
    </View>
  );
}
