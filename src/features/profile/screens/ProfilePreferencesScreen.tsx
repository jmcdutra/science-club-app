import {
  ArrowLeft,
  Bell,
  ChatCircleText,
  EnvelopeSimple,
  LockKey,
  Phone,
} from 'phosphor-react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppText } from '@/src/shared/components/ui/AppText';
import { useAppTheme } from '@/src/shared/theme/appTheme';
import { useAuthStore } from '@/src/features/auth/services/auth.store';
import {
  STUDENT_PROFILE_QUERY_KEY,
  getStudentProfile,
  updateStudentProfilePreferences,
} from '../api/profile';
import type { ProfilePreferences } from '../types';

const channels: {
  label: string;
  value: ProfilePreferences['communicationChannel'];
  icon: typeof Phone;
}[] = [
  { label: 'WhatsApp', value: 'whatsapp', icon: Phone },
  { label: 'Email', value: 'email', icon: EnvelopeSimple },
  { label: 'App', value: 'app', icon: ChatCircleText },
];

export function ProfilePreferencesScreen() {
  const { isDark } = useAppTheme();
  const { session } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: STUDENT_PROFILE_QUERY_KEY,
    queryFn: () => getStudentProfile(session?.token!),
    enabled: !!session?.token,
  });
  const [preferences, setPreferences] = useState<ProfilePreferences | null>(null);

  useEffect(() => {
    if (profile?.preferences) {
      setPreferences(profile.preferences);
    }
  }, [profile?.preferences]);

  const preferencesMutation = useMutation({
    mutationFn: (payload: Partial<ProfilePreferences>) =>
      updateStudentProfilePreferences(session?.token!, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: STUDENT_PROFILE_QUERY_KEY });
    },
  });

  const updatePreference = <Key extends keyof ProfilePreferences>(
    key: Key,
    value: ProfilePreferences[Key],
  ) => {
    setPreferences((current) => (current ? { ...current, [key]: value } : current));
    preferencesMutation.mutate({ [key]: value } as Partial<ProfilePreferences>);
  };

  if (!preferences) {
    return (
      <View style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#FFFFFF' }}>
        <SafeAreaView style={{ flex: 1 }} />
      </View>
    );
  }

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
            Preferências
          </AppText>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
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
              Controle como o app se comunica com você e gerencie suas
              configurações de privacidade.
            </AppText>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(420)}>
            <SectionTitle>NOTIFICAÇÕES</SectionTitle>
            <SectionBox isDark={isDark}>
              <ToggleRow
                icon={Bell}
                iconColor="#FBBF24"
                iconBg="rgba(234,179,8,0.12)"
                title="Lembretes de treino"
                subtitle="Avisos sobre seus treinos."
                value={preferences.workoutReminders}
                onValueChange={(value) => updatePreference('workoutReminders', value)}
              />
              <ToggleRow
                icon={Bell}
                iconColor="#38BDF8"
                iconBg="rgba(14,165,233,0.12)"
                title="Lembretes de dieta"
                subtitle="Alertas de refeições e hidratação."
                value={preferences.mealReminders}
                onValueChange={(value) => updatePreference('mealReminders', value)}
              />
              <ToggleRow
                icon={Bell}
                iconColor="#A78BFA"
                iconBg="rgba(139,92,246,0.12)"
                title="Alertas de avaliação"
                subtitle="Prazos e pareceres da equipe."
                value={preferences.assessmentAlerts}
                onValueChange={(value) => updatePreference('assessmentAlerts', value)}
                last
              />
            </SectionBox>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).duration(420)}>
            <SectionTitle>PRIVACIDADE E COMUNICAÇÃO</SectionTitle>
            <SectionBox isDark={isDark}>
              <ToggleRow
                icon={LockKey}
                iconColor="#A78BFA"
                iconBg="rgba(139,92,246,0.12)"
                title="Progresso privado"
                subtitle="Manter seu progresso visível só para você e para a equipe."
                value={preferences.privateProgress}
                onValueChange={(value) => updatePreference('privateProgress', value)}
              />

              <View style={{ padding: 16 }}>
                <AppText
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: isDark ? '#FFFFFF' : '#111827',
                    marginBottom: 4,
                  }}
                >
                  Canal de Comunicação
                </AppText>
                <AppText
                  style={{
                    fontSize: 13,
                    color: isDark ? '#888888' : '#6B7280',
                    marginBottom: 16,
                  }}
                >
                  Por onde a equipe deve falar com você?
                </AppText>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {channels.map((channel) => {
                    const Icon = channel.icon;
                    const active = preferences.communicationChannel === channel.value;
                    return (
                      <Pressable
                        key={channel.value}
                        onPress={() =>
                          updatePreference('communicationChannel', channel.value)
                        }
                        style={{
                          flex: 1,
                          height: 50,
                          borderRadius: 12,
                          backgroundColor: active
                            ? '#8B5CF6'
                            : isDark
                              ? '#222222'
                              : '#FFFFFF',
                          borderWidth: 1,
                          borderColor: active
                            ? '#8B5CF6'
                            : isDark
                              ? '#222222'
                              : '#E5E7EB',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'row',
                        }}
                      >
                        <Icon
                          color={active ? '#FFFFFF' : isDark ? '#888888' : '#6B7280'}
                          size={16}
                          weight={active ? 'bold' : 'regular'}
                        />
                        <AppText
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: active
                              ? '#FFFFFF'
                              : isDark
                                ? '#888888'
                                : '#6B7280',
                            marginLeft: 6,
                          }}
                        >
                          {channel.label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </SectionBox>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  const { isDark } = useAppTheme();
  return (
    <AppText
      style={{
        fontSize: 11,
        fontWeight: '700',
        color: isDark ? '#666666' : '#94A3B8',
        letterSpacing: 1.5,
        marginBottom: 12,
        marginLeft: 8,
      }}
    >
      {children}
    </AppText>
  );
}

function SectionBox({
  children,
  isDark,
}: {
  children: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: isDark ? '#111111' : '#F9FAFB',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: isDark ? '#222222' : '#E5E7EB',
        overflow: 'hidden',
        marginBottom: 32,
      }}
    >
      {children}
    </View>
  );
}

function ToggleRow({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  value,
  onValueChange,
  last = false,
}: {
  icon: typeof Bell;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  last?: boolean;
}) {
  const { isDark } = useAppTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: isDark ? '#222222' : '#E5E7EB',
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon color={iconColor} size={20} weight="fill" />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <AppText
          style={{
            fontSize: 15,
            fontWeight: '600',
            color: isDark ? '#FFFFFF' : '#111827',
          }}
        >
          {title}
        </AppText>
        <AppText
          style={{
            fontSize: 13,
            color: isDark ? '#888888' : '#6B7280',
            marginTop: 2,
          }}
        >
          {subtitle}
        </AppText>
      </View>
      <Switch
        ios_backgroundColor="#222222"
        thumbColor="#FFFFFF"
        trackColor={{ false: '#222222', true: '#8B5CF6' }}
        value={value}
        onValueChange={onValueChange}
      />
    </View>
  );
}
