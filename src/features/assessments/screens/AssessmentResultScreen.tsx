import { ArrowLeft, CalendarCheck, ForkKnife, ListChecks } from 'phosphor-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/src/shared/components/ui/AppText';
import { useAuthStore } from '@/src/features/auth/services/auth.store';
import { useRefetchOnFocus } from '@/src/shared/hooks/useRefetchOnFocus';

import { getEvaluationById } from '../api/assessments';
import { formatAssessmentDateTime, getResponsibleProfessionals } from '../utils';

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function HighlightRow({
  icon: Icon,
  text,
}: {
  icon: typeof ListChecks;
  text: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: '#111111',
        borderWidth: 1,
        borderColor: '#222222',
        borderRadius: 14,
        padding: 14,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: 'rgba(139,92,246,0.10)',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon color="#A78BFA" size={18} weight="duotone" />
      </View>
      <AppText
        style={{ flex: 1, fontSize: 13, fontWeight: '600', color: '#FFFFFF', lineHeight: 18 }}
      >
        {text}
      </AppText>
    </View>
  );
}

/* ─── Screen ─────────────────────────────────────────────────────────────── */

export function AssessmentResultScreen() {
  const router = useRouter();
  const { assessmentId } = useLocalSearchParams<{ assessmentId: string }>();
  const { session } = useAuthStore();
  const { data: assessment, isLoading, refetch } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => getEvaluationById(session?.token!, assessmentId!),
    enabled: !!session?.token && !!assessmentId,
  });
  useRefetchOnFocus(refetch, Boolean(session?.token && assessmentId));

  if (isLoading || !assessment) {
    return (
      <View
        style={{ flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }}
      >
        <ActivityIndicator size="large" color="#A78BFA" />
      </View>
    );
  }

  const result = assessment.result;
  const hasFinalResult =
    assessment.status === 'done' &&
    Boolean(
      result?.deliveredAt ||
      result?.coachMessage ||
      result?.trainingDecision ||
      result?.dietDecision ||
      (result?.nextSteps?.length ?? 0) > 0 ||
      result?.nextAssessmentAt
    );
  const responsibleNames = getResponsibleProfessionals(assessment);
  const coachName =
    responsibleNames.length > 0
      ? responsibleNames.join(' • ')
      : assessment.professional?.name ?? 'Equipe Science Club';
  const initials = getInitials(coachName);
  const hasProfessionalObservations = Boolean(
    result?.coachMessage?.trim() ||
    result?.trainingDecision?.trim() ||
    result?.dietDecision?.trim()
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* ── Back bar ── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 16,
          }}
        >
          <Pressable
            accessibilityRole="button"
            style={{
              width: 44,
              height: 44,
              borderRadius: 99,
              backgroundColor: '#111111',
              borderWidth: 1,
              borderColor: '#222222',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => router.back()}
          >
            <ArrowLeft color="#FFFFFF" size={20} weight="bold" />
          </Pressable>
          <AppText
            style={{
              fontSize: 11,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 3.5,
              color: '#555555',
            }}
          >
            Parecer
          </AppText>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Title area ── */}
          <Animated.View entering={FadeInDown.duration(420)} style={{ marginBottom: 20 }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 99,
                  backgroundColor: hasFinalResult ? '#34D399' : '#A78BFA',
                }}
              />
              <AppText
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  color: hasFinalResult ? '#34D399' : '#A78BFA',
                }}
              >
                {hasFinalResult ? 'Parecer entregue' : 'Parecer pendente'}
              </AppText>
            </View>
            <AppText
              className="font-heading"
              style={{
                fontSize: 22,
                fontWeight: '600',
                letterSpacing: -0.5,
                color: '#FFFFFF',
                lineHeight: 28,
              }}
            >
              {assessment.title}
            </AppText>
          </Animated.View>

          {hasFinalResult && result ? (
            <View style={{ gap: 10 }}>
              {/* ── Coach card ── */}
              <Animated.View
                entering={FadeInDown.delay(80).duration(420)}
                style={{
                  backgroundColor: 'rgba(139,92,246,0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(139,92,246,0.20)',
                  borderRadius: 20,
                  padding: 16,
                }}
              >
                {/* Coach header row */}
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}
                >
                  {/* Avatar */}
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: '#8B5CF6',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      shadowColor: '#8B5CF6',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.35,
                      shadowRadius: 8,
                      elevation: 8,
                    }}
                  >
                    <AppText
                      style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}
                    >
                      {initials}
                    </AppText>
                  </View>

                  <View style={{ flex: 1 }}>
                    <AppText style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
                      {coachName}
                    </AppText>
                    <AppText style={{ fontSize: 11, color: '#555555', marginTop: 1 }}>
                      Publicado em {formatAssessmentDateTime(result.deliveredAt)}
                    </AppText>
                  </View>

                  {/* Badge */}
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 99,
                      backgroundColor: 'rgba(34,197,94,0.12)',
                    }}
                  >
                    <AppText
                      style={{
                        fontSize: 9,
                        fontWeight: '700',
                        color: '#22C55E',
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                      }}
                    >
                      Oficial
                    </AppText>
                  </View>
                </View>

                {/* Coach message */}
                {result.coachMessage ? (
                  <AppText
                    style={{
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.82)',
                      lineHeight: 22,
                    }}
                  >
                    {result.coachMessage}
                  </AppText>
                ) : !hasProfessionalObservations ? (
                  <View
                    style={{
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.08)',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      padding: 14,
                    }}
                  >
                    <AppText
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: '#FFFFFF',
                      }}
                    >
                      Nenhuma observação atribuída
                    </AppText>
                  </View>
                ) : null}
              </Animated.View>

              {/* ── Decision highlights ── */}
              {hasProfessionalObservations ? (
                <Animated.View entering={FadeInDown.delay(120).duration(420)} style={{ gap: 8 }}>
                  {result.trainingDecision ? (
                    <HighlightRow icon={ListChecks} text={result.trainingDecision} />
                  ) : null}
                  {result.dietDecision ? (
                    <HighlightRow icon={ForkKnife} text={result.dietDecision} />
                  ) : null}
                </Animated.View>
              ) : null}

              {/* ── Next goals + next assessment date ── */}
              {((result.nextSteps ?? []).length > 0 || result.nextAssessmentAt) && (
                <Animated.View
                  entering={FadeInDown.delay(160).duration(420)}
                  style={{
                    backgroundColor: '#111111',
                    borderWidth: 1,
                    borderColor: '#222222',
                    borderRadius: 16,
                    padding: 16,
                  }}
                >
                  {(result.nextSteps ?? []).length > 0 && (
                    <>
                      <AppText
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: 3.5,
                          color: '#555555',
                          marginBottom: 14,
                        }}
                      >
                        Metas do próximo ciclo
                      </AppText>
                      <View style={{ gap: 12 }}>
                        {result.nextSteps.map((step, i) => (
                          <View
                            key={step}
                            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}
                          >
                            <View
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 99,
                                backgroundColor: 'rgba(139,92,246,0.12)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                marginTop: 1,
                              }}
                            >
                              <AppText
                                style={{
                                  fontSize: 9,
                                  fontWeight: '700',
                                  color: '#8B5CF6',
                                }}
                              >
                                {i + 1}
                              </AppText>
                            </View>
                            <AppText
                              style={{
                                flex: 1,
                                fontSize: 13,
                                color: 'rgba(255,255,255,0.80)',
                                lineHeight: 20,
                              }}
                            >
                              {step}
                            </AppText>
                          </View>
                        ))}
                      </View>
                    </>
                  )}

                  {/* Next assessment date */}
                  {result.nextAssessmentAt && (
                    <View
                      style={{
                        marginTop: (result.nextSteps ?? []).length > 0 ? 16 : 0,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        borderRadius: 12,
                        backgroundColor: '#0C0C0C',
                        padding: 14,
                      }}
                    >
                      <CalendarCheck color="#A78BFA" size={20} weight="duotone" />
                      <View style={{ flex: 1 }}>
                        <AppText
                          style={{
                            fontSize: 10,
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: 2,
                            color: '#555555',
                            marginBottom: 3,
                          }}
                        >
                          Próxima reavaliação
                        </AppText>
                        <AppText
                          style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}
                        >
                          {result.nextAssessmentAt}
                        </AppText>
                      </View>
                    </View>
                  )}
                </Animated.View>
              )}
            </View>
          ) : (
            /* ── Parecer pendente ── */
            <Animated.View
              entering={FadeInDown.delay(80).duration(420)}
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(139,92,246,0.15)',
                backgroundColor: 'rgba(139,92,246,0.06)',
                padding: 18,
              }}
            >
              <AppText
                style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 }}
              >
                Avaliação em análise
              </AppText>
              <AppText style={{ fontSize: 13, color: '#666666', lineHeight: 18 }}>
                Sua avaliação está sendo avaliada pela equipe. Em alguns dias, seu plano de treino
                e dieta estará pronto aqui.
              </AppText>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
