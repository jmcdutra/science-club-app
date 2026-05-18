import { ArrowLeft, CheckCircle, Ruler, Scales } from 'phosphor-react-native';
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
  saveStudentMeasurements,
} from '../api/profile';

function formatMeasurementDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  });
}

export function ProfileMeasurementsScreen() {
  const { isDark } = useAppTheme();
  const { session } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: STUDENT_PROFILE_QUERY_KEY,
    queryFn: () => getStudentProfile(session?.token!),
    enabled: !!session?.token,
  });
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  useEffect(() => {
    if (!profile?.body) return;
    setWeight(profile.body.weightKg ? String(profile.body.weightKg) : '');
    setHeight(profile.body.heightCm ? String(profile.body.heightCm) : '');
  }, [profile?.body]);

  const saveMutation = useMutation({
    mutationFn: () =>
      saveStudentMeasurements(session?.token!, {
        weightKg: weight ? Number(weight.replace(',', '.')) : null,
        heightCm: height ? Number(height.replace(',', '.')) : null,
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
            Medidas Corporais
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
                  marginBottom: 24,
                  lineHeight: 22,
                }}
              >
                Atualize suas medidas para manter o histórico da sua evolução no
                app.
              </AppText>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).duration(420)}>
              <MeasurementInput
                icon={<Scales color="#FBBF24" size={20} weight="fill" />}
                isDark={isDark}
                label="Peso atual (kg)"
                value={weight}
                onChangeText={setWeight}
                placeholder="Ex: 75.5"
              />

              <MeasurementInput
                icon={<Ruler color="#38BDF8" size={20} weight="fill" />}
                isDark={isDark}
                label="Altura (cm)"
                value={height}
                onChangeText={setHeight}
                placeholder="Ex: 180"
              />

              <View style={{ marginTop: 8, marginBottom: 28 }}>
                <AppButton
                  onPress={() => saveMutation.mutate()}
                  leftIcon={<CheckCircle color="#FFFFFF" size={18} weight="bold" />}
                  fullWidth
                >
                  {saveMutation.isPending ? 'Salvando...' : 'Salvar Medidas'}
                </AppButton>
              </View>

              <View
                style={{
                  backgroundColor: isDark ? '#111111' : '#F9FAFB',
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: isDark ? '#222222' : '#E5E7EB',
                  overflow: 'hidden',
                }}
              >
                <View style={{ padding: 16 }}>
                  <AppText
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: isDark ? '#FFFFFF' : '#111827',
                    }}
                  >
                    Histórico
                  </AppText>
                </View>

                {profile?.measurements?.length ? (
                  profile.measurements.map((measurement, index) => (
                    <View key={measurement.id}>
                      <View
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 14,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <View>
                          <AppText
                            style={{
                              fontSize: 14,
                              fontWeight: '600',
                              color: isDark ? '#FFFFFF' : '#111827',
                            }}
                          >
                            {formatMeasurementDate(measurement.recordedAt)}
                          </AppText>
                          <AppText
                            style={{
                              fontSize: 12,
                              color: isDark ? '#888888' : '#6B7280',
                              marginTop: 2,
                            }}
                          >
                            {measurement.weightKg ?? '-'} kg • {measurement.heightCm ?? '-'} cm
                          </AppText>
                        </View>
                      </View>
                      {index < profile.measurements.length - 1 ? (
                        <View
                          style={{
                            height: 1,
                            backgroundColor: isDark ? '#222222' : '#E5E7EB',
                            marginLeft: 16,
                          }}
                        />
                      ) : null}
                    </View>
                  ))
                ) : (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                    <AppText
                      style={{
                        fontSize: 13,
                        color: isDark ? '#888888' : '#6B7280',
                      }}
                    >
                      Nenhuma medida registrada até o momento.
                    </AppText>
                  </View>
                )}
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function MeasurementInput({
  icon,
  isDark,
  label,
  value,
  onChangeText,
  placeholder,
}: {
  icon: React.ReactNode;
  isDark: boolean;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
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
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#555555' : '#9CA3AF'}
          value={value}
          onChangeText={onChangeText}
        />
      </View>
    </View>
  );
}
