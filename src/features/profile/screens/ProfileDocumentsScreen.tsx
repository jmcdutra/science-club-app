import { ArrowLeft, FileText } from 'phosphor-react-native';
import { router } from 'expo-router';
import { ScrollView, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';

import { AppText } from '@/src/shared/components/ui/AppText';
import { useAppTheme } from '@/src/shared/theme/appTheme';
import { useAuthStore } from '@/src/features/auth/services/auth.store';
import { STUDENT_PROFILE_QUERY_KEY, getStudentProfile } from '../api/profile';

export function ProfileDocumentsScreen() {
  const { isDark } = useAppTheme();
  const { session } = useAuthStore();
  const { data: profile } = useQuery({
    queryKey: STUDENT_PROFILE_QUERY_KEY,
    queryFn: () => getStudentProfile(session?.token!),
    enabled: !!session?.token,
  });

  const hasDocuments = Boolean(profile?.documents?.length);

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
            Meus Documentos
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
              Documentos vinculados à sua conta no aplicativo.
            </AppText>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(420)}>
            <View
              style={{
                backgroundColor: isDark ? '#111111' : '#F9FAFB',
                borderRadius: 24,
                borderWidth: 1,
                borderColor: isDark ? '#222222' : '#E5E7EB',
                padding: 20,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 180,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: 'rgba(139,92,246,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <FileText color="#8B5CF6" size={24} weight="fill" />
              </View>
              <AppText
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: isDark ? '#FFFFFF' : '#111827',
                  marginBottom: 6,
                }}
              >
                {hasDocuments ? 'Documentos carregados' : 'Nenhum documento encontrado'}
              </AppText>
              <AppText
                style={{
                  fontSize: 13,
                  lineHeight: 20,
                  textAlign: 'center',
                  color: isDark ? '#888888' : '#6B7280',
                }}
              >
                {hasDocuments
                  ? 'Os documentos disponíveis aparecerão nesta área.'
                  : 'Nenhum documento encontrado'}
              </AppText>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
