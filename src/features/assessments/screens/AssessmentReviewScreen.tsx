import { ArrowLeft, CheckCircle, PaperPlaneTilt, WarningCircle } from 'phosphor-react-native';
import { router, type Href, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, View, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { AppScreen } from '@/src/shared/components/ui/AppScreen';
import { AppText } from '@/src/shared/components/ui/AppText';
import { useAppTheme } from '@/src/shared/theme/appTheme';
import { useAuthStore } from '@/src/features/auth/services/auth.store';

import { createAssessmentDraft, useAssessmentsStore } from '../services/assessments.store';
import { getEvaluationById, submitEvaluation, uploadFile } from '../api/assessments';
import { getQuestionnaireProgress, getPhotoProgress, getExamProgress, canSubmitAssessment } from '../utils';

export function AssessmentReviewScreen() {
  const { isDark } = useAppTheme();
  const { assessmentId } = useLocalSearchParams<{ assessmentId: string }>();
  const { session } = useAuthStore();
  const queryClient = useQueryClient();
  const drafts = useAssessmentsStore((state) => state.drafts);
  const submitDraft = useAssessmentsStore((state) => state.submitAssessment);
  const initializeDraft = useAssessmentsStore((state) => state.initializeDraft);

  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: assessment, isLoading } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => getEvaluationById(session?.token!, assessmentId!),
    enabled: !!session?.token && !!assessmentId,
  });

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
      setErrorMsg('Não foi possível enviar a avaliação. Tente novamente.');
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
          .filter(([_, uri]) => !!uri)
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
          .filter(([_, uri]) => !!uri)
          .map(async ([id, uri]) => {
            if (uri!.startsWith('http')) return { url: uri!, label: id };
            const { url } = await uploadFile(session?.token!, uri!, 'exams/evaluations');
            return { url, label: id };
          }),
      );

      mutation.mutate({
        answers: Object.entries(draft.answers).map(([question, answer]) => ({
          question,
          answer: Array.isArray(answer) ? answer.join(', ') : String(answer),
        })),
        photos: uploadedPhotos,
        exams: uploadedExams,
      });
    } catch {
      setErrorMsg('Erro ao fazer upload dos arquivos. Verifique sua conexão e tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const isLoading_ = mutation.isPending || isUploading;

  return (
    <AppScreen contentClassName="px-5 pb-12 pt-5">
      {/* Header */}
      <View className="mb-10 flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center rounded-full bg-bg-surface border border-border-subtle"
          onPress={() => router.back()}
        >
          <ArrowLeft color={isDark ? '#FFFFFF' : '#111827'} size={20} weight="bold" />
        </Pressable>
        <AppText className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">Revisar</AppText>
        <View className="h-11 w-11" />
      </View>

      <Animated.View entering={FadeInDown.duration(420)} className="mb-8">
        <AppText className="text-2xl font-bold leading-tight text-text-main">Tudo certo?</AppText>
        <AppText className="mt-2 text-sm text-text-muted leading-relaxed">
          Confira o resumo antes de enviar para a equipe. Após o envio, não será possível editar.
        </AppText>
      </Animated.View>

      <View className="gap-3 mb-8">
        {assessment.questionnaire.questions.length > 0 && (
          <ReviewSection
            title="Questionário"
            status={`${questionnaire.answered}/${questionnaire.total} respondidas`}
            done={questionnaire.percent === 100}
          >
            {assessment.questionnaire.questions.map((q: any) => (
              <View key={q.id || q._id} className="mb-3 border-b border-border-subtle/50 pb-3 last:mb-0 last:border-0 last:pb-0">
                <AppText className="text-[11px] font-bold uppercase tracking-wide text-text-muted mb-1">
                  {q.label}
                </AppText>
                <AppText className="text-sm text-text-main">
                  {draft.answers[q.id || q._id]
                    ? Array.isArray(draft.answers[q.id || q._id])
                      ? (draft.answers[q.id || q._id] as string[]).join(', ')
                      : draft.answers[q.id || q._id]
                    : 'Não respondido'}
                </AppText>
              </View>
            ))}
          </ReviewSection>
        )}

        {assessment.questionnaire.image_questions.length > 0 && (
          <ReviewSection
            title="Fotos corporais"
            status={`${photos.done}/${photos.total} fotos`}
            done={photos.done === photos.total}
          >
            <AppText className="text-sm text-text-muted">
              {photos.done} de {photos.total} posições capturadas.
            </AppText>
          </ReviewSection>
        )}

        {assessment.questionnaire.attachment_questions.length > 0 && (
          <ReviewSection
            title="Exames e anexos"
            status={`${exams.done}/${exams.total} anexos`}
            done={exams.done === exams.total}
          >
            <AppText className="text-sm text-text-muted">
              {exams.done} de {exams.total} documentos anexados.
            </AppText>
          </ReviewSection>
        )}
      </View>

      {/* Error message */}
      {errorMsg && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          className="flex-row items-start gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 mb-4"
        >
          <WarningCircle color="#F87171" size={18} weight="fill" style={{ marginTop: 1 }} />
          <AppText className="flex-1 text-sm text-red-400">{errorMsg}</AppText>
        </Animated.View>
      )}

      <Pressable
        accessibilityRole="button"
        disabled={isLoading_ || isSubmitted}
        style={{ opacity: isSubmitted ? 0.5 : 1 }}
        className="min-h-[56px] flex-row items-center justify-center gap-2 rounded-2xl bg-brand-primary"
        onPress={handleSubmit}
      >
        {isLoading_ ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <AppText className="text-base font-bold text-white">
              {isSubmitted ? 'Avaliação já enviada' : 'Confirmar e enviar'}
            </AppText>
            {!isSubmitted && <PaperPlaneTilt color="#FFFFFF" size={18} weight="bold" />}
          </>
        )}
      </Pressable>
    </AppScreen>
  );
}

function ReviewSection({
  title,
  status,
  done,
  children,
}: {
  title: string;
  status: string;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <View className="rounded-[24px] border border-border-subtle bg-bg-surface p-5">
      <View className="flex-row items-center justify-between mb-4">
        <View style={{ flex: 1 }}>
          <AppText className="text-[11px] font-bold uppercase tracking-[0.25em] text-text-muted">{title}</AppText>
          <AppText className="text-base font-bold text-text-main mt-0.5">{status}</AppText>
        </View>
        {done && <CheckCircle color="#34D399" size={20} weight="fill" />}
      </View>
      <View className="rounded-2xl bg-bg-base p-4">{children}</View>
    </View>
  );
}
