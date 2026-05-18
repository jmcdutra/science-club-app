import { ArrowLeft, CheckCircle, FileText, PaperPlaneTilt, Trash, UploadSimple } from 'phosphor-react-native';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import * as DocumentPicker from 'expo-document-picker';

import { AppScreen } from '@/src/shared/components/ui/AppScreen';
import { AppButton } from '@/src/shared/components/ui/AppButton';
import { AppText } from '@/src/shared/components/ui/AppText';
import { useAuthStore } from '@/src/features/auth/services/auth.store';
import { useRefetchOnFocus } from '@/src/shared/hooks/useRefetchOnFocus';

import { createAssessmentDraft, useAssessmentsStore } from '../services/assessments.store';
import { getExamProgress } from '../utils';
import { getEvaluationById } from '../api/assessments';

export function AssessmentExamsScreen() {
  const router = useRouter();
  const { assessmentId } = useLocalSearchParams<{ assessmentId: string }>();
  const { session } = useAuthStore();
  const drafts = useAssessmentsStore((state) => state.drafts);
  const setExam = useAssessmentsStore((state) => state.setExam);
  const initializeDraft = useAssessmentsStore((state) => state.initializeDraft);

  const { data: assessment, isLoading, refetch } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => getEvaluationById(session?.token!, assessmentId!),
    enabled: !!session?.token && !!assessmentId,
  });
  useRefetchOnFocus(refetch, Boolean(session?.token && assessmentId));

  useEffect(() => {
    if (assessment) {
      initializeDraft(assessment as any);
    }
  }, [assessment, initializeDraft]);

  if (isLoading || !assessment) {
    return (
      <AppScreen contentClassName="items-center justify-center">
        <ActivityIndicator size="large" color="#A78BFA" />
      </AppScreen>
    );
  }

  const draft = drafts[assessment.id] ?? createAssessmentDraft(assessment as any);
  const progress = getExamProgress(assessment as any, draft);
  const currentAssessmentId = assessment.id;
  const isSubmitted =
    assessment.status === 'analysis' ||
    assessment.status === 'answered' ||
    assessment.status === 'done' ||
    draft.submitted;

  async function handlePickFile(examId: string) {
    if (isSubmitted) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'image/*',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets.length) return;

    const file = result.assets[0];
    if (!file.uri) {
      Alert.alert('Arquivo inválido', 'Não foi possível ler o arquivo selecionado.');
      return;
    }

    setExam(currentAssessmentId, examId, {
      uri: file.uri,
      name: file.name,
      mimeType: file.mimeType || undefined,
    });
  }

  return (
    <AppScreen contentClassName="px-6 pb-12 pt-5">
      {/* ── Back bar ── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <Pressable
          accessibilityRole="button"
          style={{
            width: 44, height: 44, borderRadius: 99,
            backgroundColor: '#111111', borderWidth: 1, borderColor: '#222222',
            alignItems: 'center', justifyContent: 'center',
          }}
          onPress={() => router.back()}
        >
          <ArrowLeft color="#FFFFFF" size={20} weight="bold" />
        </Pressable>
        <AppText
          style={{
            fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
            letterSpacing: 3, color: '#555555',
          }}
        >
          Exames e Anexos
        </AppText>
        <View style={{ width: 44 }} />
      </View>

      {/* ── Editorial heading ── */}
      <Animated.View entering={FadeInDown.duration(420)} style={{ marginBottom: 24 }}>
        <AppText
          className="font-heading"
          style={{
            fontSize: 22,
            fontWeight: '600',
            letterSpacing: -0.5,
            color: '#FFFFFF',
            marginBottom: 6,
            lineHeight: 28,
          }}
        >
          Exames e anexos
        </AppText>
        <AppText style={{ fontSize: 13, color: '#666666', lineHeight: 18, marginBottom: 20 }}>
          Selecione imagens ou documentos dos seus exames. Eles ficam salvos no rascunho até o envio.
        </AppText>

        {/* ── Progress strip ── */}
        <View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <AppText style={{ fontSize: 12, fontWeight: '600', color: '#666666' }}>
              {progress.done} de {progress.total} anexos
            </AppText>
            <AppText style={{ fontSize: 11, fontWeight: '700', color: '#A78BFA' }}>
              {progress.percent}%
            </AppText>
          </View>
          <View style={{ height: 3, borderRadius: 99, backgroundColor: '#1A1A1A' }}>
            <View
              style={{
                height: 3,
                borderRadius: 99,
                backgroundColor: '#8B5CF6',
                width: `${progress.percent}%`,
              }}
            />
          </View>
        </View>
      </Animated.View>

      {/* ── Exam cards ── */}
      {assessment.questionnaire.attachment_questions.length ? (
        <View style={{ gap: 8, marginBottom: 24 }}>
          {assessment.questionnaire.attachment_questions.map((exam: any, index: number) => {
            const examId = exam.id || exam._id;
            const attached = Boolean(draft.exams[examId]);
            const attachment = draft.exams[examId];
            const attachmentName =
              typeof attachment === 'string'
                ? attachment.split('/').pop()
                : attachment?.name;

            return (
              <Animated.View
                key={examId || index}
                entering={FadeInDown.delay(60 + index * 40).duration(420)}
                style={{
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: attached ? 'rgba(52,211,153,0.20)' : '#222222',
                  backgroundColor: '#111111',
                  padding: 14,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: attached ? 'rgba(52,211,153,0.10)' : 'rgba(139,92,246,0.10)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {attached ? (
                      <CheckCircle size={20} color="#34D399" weight="fill" />
                    ) : (
                      <FileText size={20} color="#A78BFA" weight="duotone" />
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <View
                        style={{
                          borderRadius: 6,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          backgroundColor: '#1A1A1A',
                        }}
                      >
                        <AppText style={{ fontSize: 9, fontWeight: '700', color: '#555555', textTransform: 'uppercase', letterSpacing: 1 }}>
                          {exam.required ? 'Obrigatório' : 'Opcional'}
                        </AppText>
                      </View>
                    </View>
                    <AppText style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginBottom: 2 }}>
                      {exam.label}
                    </AppText>
                    {exam.description ? (
                      <AppText style={{ fontSize: 11, color: '#666666', lineHeight: 15 }}>
                        {exam.description}
                      </AppText>
                    ) : null}
                    {attachmentName ? (
                      <AppText style={{ fontSize: 11, color: '#34D399', lineHeight: 15, marginTop: 6 }}>
                        {attachmentName}
                      </AppText>
                    ) : null}
                  </View>
                </View>

                <AppButton
                  variant={attached ? 'secondary' : 'primary'}
                  fullWidth
                  disabled={isSubmitted}
                  onPress={() => attached ? setExam(assessment.id, examId, null) : handlePickFile(examId)}
                  leftIcon={
                    attached
                      ? <Trash size={15} color="#888888" weight="bold" />
                      : <UploadSimple size={15} color="#FFFFFF" weight="bold" />
                  }
                >
                  <AppText
                    style={{
                      fontWeight: '600',
                      fontSize: 13,
                      color: attached ? '#888888' : '#FFFFFF',
                    }}
                  >
                    {attached ? 'Remover anexo' : 'Selecionar arquivo'}
                  </AppText>
                </AppButton>
              </Animated.View>
            );
          })}
        </View>
      ) : (
        <Animated.View
          entering={FadeInDown.delay(80).duration(420)}
          style={{
            borderRadius: 16, borderWidth: 1, borderColor: '#222222',
            backgroundColor: '#111111', padding: 18, marginBottom: 24,
          }}
        >
          <AppText style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginBottom: 6 }}>
            Sem anexos nesta etapa
          </AppText>
          <AppText style={{ fontSize: 12, color: '#666666', lineHeight: 17 }}>
            Para esta avaliação, a equipe precisa apenas do questionário e das fotos padronizadas.
          </AppText>
        </Animated.View>
      )}

      {/* ── CTA ── */}
      <Animated.View entering={FadeInDown.delay(180).duration(420)}>
        <AppButton
          variant="primary"
          fullWidth
          onPress={() => router.push(`/(app)/assessments/${assessment.id}/review` as Href)}
          rightIcon={<PaperPlaneTilt color="#fff" size={18} weight="bold" />}
        >
          <AppText style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
            Revisar e enviar
          </AppText>
        </AppButton>
      </Animated.View>
    </AppScreen>
  );
}
