import { ArrowLeft, CheckCircle, PaperPlaneTilt, WarningCircle } from 'phosphor-react-native';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { AppScreen } from '@/src/shared/components/ui/AppScreen';
import { AppButton } from '@/src/shared/components/ui/AppButton';
import { AppText } from '@/src/shared/components/ui/AppText';
import { useAuthStore } from '@/src/features/auth/services/auth.store';
import { useRefetchOnFocus } from '@/src/shared/hooks/useRefetchOnFocus';

import { createAssessmentDraft, useAssessmentsStore } from '../services/assessments.store';
import { getEvaluationById, submitEvaluation, uploadFile } from '../api/assessments';
import {
  getExamProgress,
  getPhotoProgress,
  getQuestionnaireProgress,
  canSubmitAssessment,
} from '../utils';

export function AssessmentReviewScreen() {
  const router = useRouter();
  const { assessmentId } = useLocalSearchParams<{ assessmentId: string }>();
  const { session } = useAuthStore();
  const queryClient = useQueryClient();
  const drafts = useAssessmentsStore((state) => state.drafts);
  const submitDraft = useAssessmentsStore((state) => state.submitAssessment);
  const initializeDraft = useAssessmentsStore((state) => state.initializeDraft);

  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: assessment, isLoading, refetch } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => getEvaluationById(session?.token!, assessmentId!),
    enabled: !!session?.token && !!assessmentId,
  });
  useRefetchOnFocus(refetch, Boolean(session?.token && assessmentId));

  const mutation = useMutation({
    mutationFn: (data: any) => submitEvaluation(session?.token!, assessmentId!, data),
    onSuccess: () => {
      submitDraft(assessmentId!);
      queryClient.invalidateQueries({ queryKey: ['assessment', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      router.dismissAll();
      router.replace('/(app)/(tabs)/assessments' as any);
    },
    onError: () => {
      setErrorMsg('Não foi possível enviar. Tente novamente.');
    },
  });

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
  const questionnaire = getQuestionnaireProgress(assessment as any, draft);
  const photos = getPhotoProgress(assessment as any, draft);
  const exams = getExamProgress(assessment as any, draft);
  const canSubmit = canSubmitAssessment(assessment as any, draft);
  const isSubmitted =
    assessment.status === 'analysis' ||
    assessment.status === 'answered' ||
    assessment.status === 'done' ||
    draft.submitted;

  const handleSubmit = async () => {
    if (!canSubmit) {
      setErrorMsg('Preencha todos os campos obrigatórios antes de enviar.');
      return;
    }
    setErrorMsg(null);
    setIsUploading(true);
    try {
      const uploadedPhotos = await Promise.all(
        Object.entries(draft.photos)
          .filter(([, uri]) => !!uri)
          .map(async ([id, uri]) => {
            const label =
              assessment.questionnaire.image_questions.find(
                (iq: any) => iq.id === id || iq._id === id,
              )?.label || id;
            if (uri!.startsWith('http')) return { position: id, url: uri!, label };
            const { url } = await uploadFile(session?.token!, uri!, 'photos/evaluations');
            return { position: id, url, label };
          }),
      );

      const uploadedExams = await Promise.all(
        Object.entries(draft.exams)
          .filter(([, asset]) => !!asset)
          .map(async ([id, asset]) => {
            const label =
              assessment.questionnaire.attachment_questions.find(
                (item: any) => item.id === id || item._id === id,
              )?.label || id;

            if (!asset) return null;

            if (typeof asset === 'string') {
              if (asset.startsWith('http')) return { url: asset, label };
              const { url } = await uploadFile(session?.token!, asset, 'exams/evaluations');
              return { url, label };
            }

            const { url } = await uploadFile(session?.token!, asset.uri, 'exams/evaluations', {
              name: asset.name,
              mimeType: asset.mimeType,
            });
            return { url, label };
          }),
      );

      mutation.mutate({
        answers: Object.entries(draft.answers).map(([question, answer]) => ({
          question,
          answer: Array.isArray(answer) ? answer.join(', ') : String(answer),
        })),
        photos: uploadedPhotos,
        exams: uploadedExams.filter((item): item is { url: string; label: string } => Boolean(item)),
      });
    } catch {
      setErrorMsg('Erro ao fazer upload dos arquivos. Verifique sua conexão e tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const isBusy = mutation.isPending || isUploading;

  return (
    <AppScreen contentClassName="px-6 pb-8 pt-5">
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
          Revisar
        </AppText>
        <View style={{ width: 44 }} />
      </View>

      {/* ── Editorial heading ── */}
      <Animated.View entering={FadeInDown.duration(420)} style={{ marginBottom: 24 }}>
        <AppText
          className="font-heading"
          style={{ fontSize: 22, fontWeight: '600', letterSpacing: -0.5, color: '#FFFFFF', marginBottom: 6, lineHeight: 28 }}
        >
          Tudo certo?
        </AppText>
        <AppText style={{ fontSize: 13, color: '#666666', lineHeight: 18 }}>
          Confira o resumo antes de enviar. Após o envio não será possível editar.
        </AppText>
      </Animated.View>

      {/* ── Review sections ── */}
      <View style={{ gap: 8, marginBottom: 24 }}>
        {assessment.questionnaire.questions.length > 0 && (
          <ReviewSection
            title="Questionário"
            status={`${questionnaire.answered}/${questionnaire.total} respondidas`}
            done={questionnaire.percent === 100}
            delay={80}
          >
            <View style={{ gap: 12 }}>
              {assessment.questionnaire.questions.map((q: any) => {
                const qId = q.id || q._id;
                const ans = draft.answers[qId];
                const ansText = ans
                  ? Array.isArray(ans)
                    ? ans.join(', ')
                    : String(ans)
                  : null;
                return (
                  <View
                    key={qId}
                    style={{
                      borderBottomWidth: 1,
                      borderBottomColor: '#1A1A1A',
                      paddingBottom: 12,
                    }}
                  >
                    <AppText
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: 2,
                        color: '#555555',
                        marginBottom: 4,
                      }}
                    >
                      {q.label}
                    </AppText>
                    <AppText
                      style={{
                        fontSize: 14,
                        color: ansText ? '#CCCCCC' : '#3A3A3A',
                      }}
                    >
                      {ansText ?? 'Não respondido'}
                    </AppText>
                  </View>
                );
              })}
            </View>
          </ReviewSection>
        )}

        {assessment.questionnaire.image_questions.length > 0 && (
          <ReviewSection
            title="Fotos corporais"
            status={`${photos.done}/${photos.total} fotos`}
            done={photos.done === photos.total}
            delay={140}
          >
            <AppText style={{ fontSize: 13, color: '#666666' }}>
              {photos.done} de {photos.total} posições capturadas.
            </AppText>
          </ReviewSection>
        )}

        {assessment.questionnaire.attachment_questions.length > 0 && (
          <ReviewSection
            title="Exames e anexos"
            status={`${exams.done}/${exams.total} anexos`}
            done={exams.done === exams.total}
            delay={180}
          >
            <AppText style={{ fontSize: 13, color: '#666666' }}>
              {exams.done} de {exams.total} documentos anexados.
            </AppText>
          </ReviewSection>
        )}
      </View>

      {/* ── Error ── */}
      {errorMsg && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 10,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: 'rgba(248,113,113,0.15)',
            backgroundColor: 'rgba(248,113,113,0.08)',
            paddingHorizontal: 14,
            paddingVertical: 12,
            marginBottom: 12,
          }}
        >
          <WarningCircle color="#F87171" size={18} weight="fill" style={{ marginTop: 1 }} />
          <AppText style={{ flex: 1, fontSize: 13, color: '#F87171', lineHeight: 18 }}>
            {errorMsg}
          </AppText>
        </Animated.View>
      )}

      {/* ── Submit CTA ── */}
      <AppButton
        variant="primary"
        fullWidth
        loading={isBusy}
        disabled={isBusy || isSubmitted}
        onPress={handleSubmit}
        rightIcon={
          !isSubmitted ? (
            <PaperPlaneTilt color="#fff" size={18} weight="bold" />
          ) : undefined
        }
      >
        <AppText style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
          {isSubmitted ? 'Avaliação já enviada' : 'Confirmar e enviar'}
        </AppText>
      </AppButton>
    </AppScreen>
  );
}

function ReviewSection({
  title,
  status,
  done,
  delay,
  children,
}: {
  title: string;
  status: string;
  done: boolean;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(420)}
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#222222',
        backgroundColor: '#111111',
        padding: 16,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <View style={{ flex: 1 }}>
          <AppText
            style={{
              fontSize: 11,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 3,
              color: '#555555',
              marginBottom: 3,
            }}
          >
            {title}
          </AppText>
          <AppText style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>{status}</AppText>
        </View>
        {done && <CheckCircle color="#34D399" size={20} weight="fill" />}
      </View>
      <View
        style={{
          borderRadius: 12,
          backgroundColor: '#0C0C0C',
          padding: 14,
        }}
      >
        {children}
      </View>
    </Animated.View>
  );
}
