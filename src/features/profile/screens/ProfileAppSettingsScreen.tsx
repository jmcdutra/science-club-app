import { ArrowLeft, HardDrives, Moon, Sun, Trash } from 'phosphor-react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppText } from '@/src/shared/components/ui/AppText';
import { useAppTheme } from '@/src/shared/theme/appTheme';
import {
  AppThemePreference,
  useThemePreferenceStore,
} from '@/src/shared/theme/themePreference.store';
import { useAuthStore } from '@/src/features/auth/services/auth.store';
import {
  STUDENT_PROFILE_QUERY_KEY,
  getStudentProfile,
  updateStudentProfilePreferences,
} from '../api/profile';

const themeOptions: {
  label: string;
  value: AppThemePreference;
  icon: typeof Sun;
}[] = [
  { label: 'Automático', value: 'system', icon: Sun },
  { label: 'Claro', value: 'light', icon: Sun },
  { label: 'Escuro', value: 'dark', icon: Moon },
];

export function ProfileAppSettingsScreen() {
  const { isDark } = useAppTheme();
  const { session } = useAuthStore();
  const queryClient = useQueryClient();
  const setThemePreference = useThemePreferenceStore((state) => state.setThemePreference);
  const themePreference = useThemePreferenceStore((state) => state.themePreference);
  const { data: profile } = useQuery({
    queryKey: STUDENT_PROFILE_QUERY_KEY,
    queryFn: () => getStudentProfile(session?.token!),
    enabled: !!session?.token,
  });

  const preferencesMutation = useMutation({
    mutationFn: (nextThemePreference: AppThemePreference) =>
      updateStudentProfilePreferences(session?.token!, {
        themePreference: nextThemePreference,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: STUDENT_PROFILE_QUERY_KEY });
    },
  });

  const activeThemePreference =
    profile?.preferences.themePreference || themePreference;

  useEffect(() => {
    if (!profile?.preferences.themePreference) return;
    void setThemePreference(profile.preferences.themePreference);
  }, [profile?.preferences.themePreference, setThemePreference]);

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
            Configurações do App
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
                marginBottom: 24,
                lineHeight: 22,
              }}
            >
              Ajuste as preferências do aplicativo no seu dispositivo.
            </AppText>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(420)}>
            <View
              style={{
                backgroundColor: isDark ? '#111111' : '#F9FAFB',
                borderRadius: 24,
                borderWidth: 1,
                borderColor: isDark ? '#222222' : '#E5E7EB',
                padding: 16,
                marginBottom: 24,
              }}
            >
              <AppText
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: isDark ? '#FFFFFF' : '#111827',
                  marginBottom: 14,
                }}
              >
                Tema do app
              </AppText>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const active = activeThemePreference === option.value;

                  return (
                    <Pressable
                      key={option.value}
                      onPress={async () => {
                        await setThemePreference(option.value);
                        preferencesMutation.mutate(option.value);
                      }}
                      style={{
                        flex: 1,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: active ? '#8B5CF6' : isDark ? '#222222' : '#E5E7EB',
                        backgroundColor: active
                          ? 'rgba(139,92,246,0.10)'
                          : isDark
                            ? '#0B0B0B'
                            : '#FFFFFF',
                        paddingVertical: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon
                        color={active ? '#8B5CF6' : isDark ? '#888888' : '#6B7280'}
                        size={18}
                        weight={active ? 'fill' : 'regular'}
                      />
                      <AppText
                        style={{
                          marginTop: 8,
                          fontSize: 12,
                          fontWeight: '700',
                          color: active ? '#8B5CF6' : isDark ? '#FFFFFF' : '#111827',
                        }}
                      >
                        {option.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <ActionCard
              isDark={isDark}
              icon={<HardDrives color="#38BDF8" size={20} weight="fill" />}
              iconBg="rgba(56,189,248,0.12)"
              title="Modo Offline"
              subtitle="Em desenvolvimento"
              onPress={() => Alert.alert('Modo Offline', 'Em desenvolvimento')}
            />

            <ActionCard
              isDark={isDark}
              icon={<Trash color="#EF4444" size={20} weight="fill" />}
              iconBg="rgba(239,68,68,0.12)"
              title="Limpar cache local"
              subtitle="Em desenvolvimento"
              onPress={() => Alert.alert('Limpar cache local', 'Em desenvolvimento')}
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ActionCard({
  icon,
  iconBg,
  isDark,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  iconBg: string;
  isDark: boolean;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: isDark ? '#111111' : '#F9FAFB',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: isDark ? '#222222' : '#E5E7EB',
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
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
        {icon}
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
    </Pressable>
  );
}
