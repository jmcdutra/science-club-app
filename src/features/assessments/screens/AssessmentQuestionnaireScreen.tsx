import { ArrowLeft, Camera, ClipboardText, PaperPlaneTilt } from 'phosphor-react-native';
import { router, type Href, useLocalSearchParams } from 'expo-router';
import { Pressable, View, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { AppScreen } from '@/src/shared/components/ui/AppScreen';
import { AppText } from '@/src/shared/components/ui/AppText';
import { useAppTheme } from '@/src/shared/theme/appTheme';
import { cn } from '@/src/shared/utils/cn';
import { useAuthStore } from '@/src/features/auth/services/auth.store';

import { AssessmentFieldRenderer } from '../components/AssessmentFieldRenderer';
import { createAssessmentDraft, useAssessmentsStore } from '../services/assessments.store';
import { getQuestionnaireProgress, getRequiredMissing, cleanText } from '../utils';
import { getEvaluationById } from '../api/assessments';

export function AssessmentQuestionnaireScreen() {
  const { isDark } = useAppTheme();
  const { assessmentId } = useLocalSearchParams<{ assessmentId: string }>();
  const { session } = useAuthStore();
  const drafts = useAssessmentsStore((state) => state.drafts);
  const setAnswer = useAssessmentsStore((state) => state.setAnswer);
  const toggleCheckboxAnswer = useAssessmentsStore((state) => state.toggleCheckboxAnswer);
  const initializeDraft = useAssessmentsStore((state) => state.initializeDraft);

  const { data: assessment, isLoading } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => getEvaluationById(session?.token!, assessmentId!),
    enabled: !!session?.token && !!assessmentId,
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
  const progress = getQuestionnaireProgress(assessment as any, draft);
  const missing = getRequiredMissing(assessment as any, draft).length;
  const isSubmitted =
    assessment.status === 'analysis' ||
    assessment.status === 'answered' ||
    assessment.status === 'done' ||
    draft.submitted;

  const hasPhotos = assessment.questionnaire.image_questions.length > 0;
  const hasExams = assessment.questionnaire.attachment_questions.length > 0;

  const handleNext = () => {
    if (hasPhotos) {
      router.push(`/(app)/assessments/${assessment.id}/photos` as Href);
    } else if (hasExams) {
      router.push(`/(app)/assessments/${assessment.id}/exams` as Href);
    } else {
      router.push(`/(app)/assessments/${assessment.id}/review` as Href);
    }
  };

  return (
    <AppScreen contentClassName="px-5 pb-12 pt-5" keyboard>
      {/* Header */}
      <View className="mb-10 flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center rounded-full bg-bg-surface border border-border-subtle"
          onPress={() => router.back()}
        >
          <ArrowLeft color={isDark ? '#FFFFFF' : '#111827'} size={20} weight="bold" />
        </Pressable>
        <AppText className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">
          Questionário
        </AppText>
        <View className="h-11 w-11" />
      </View>

      <Animated.View entering={FadeInDown.duration(420)}>
        {/* Hero card */}
        <View className="mb-6 rounded-[28px] border border-border-subtle bg-bg-surface p-5">
          <View className="mb-4 h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10">
            <ClipboardText color="#A78BFA" size={24} weight="duotone" />
          </View>
          <AppText className="text-2xl font-bold leading-tight text-text-main">
            {assessment.questionnaire.title}
          </AppText>
          <AppText className="mt-2 text-sm leading-relaxed text-text-muted">
            {cleanText(assessment.questionnaire.description)}
          </AppText>

          {/* Progress */}
          <View className="mt-5">
            <View className="mb-2 flex-row items-center justify-between">
              <AppText className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
                {progress.answered}/{progress.total} respondidas
              </AppText>
              {missing > 0 && !isSubmitted ? (
                <AppText className="text-[11px] font-bold text-amber-400">
                  {missing} obrigatória{missing > 1 ? 's' : ''} faltando
                </AppText>
              ) : (
                <AppText className="text-[11px] font-bold text-brand-secondary">{progress.percent}%</AppText>
              )}
            </View>
            <View className="h-1.5 overflow-hidden rounded-full bg-bg-base">
              <View className="h-full rounded-full bg-brand-primary" style={{ width: `${progress.percent}%` }} />
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(420)} className={cn('gap-3 mb-8', isSubmitted && 'opacity-70')}>
        {assessment.questionnaire.questions.map((field) => (
          <AssessmentFieldRenderer
            key={field.id}
            field={field as any}
            value={draft.answers[field.id]}
            onChange={(value) => !isSubmitted && setAnswer(assessment.id, field.id, value)}
            onToggleOption={(option) => !isSubmitted && toggleCheckboxAnswer(assessment.id, field.id, option)}
          />
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(180).duration(420)}>
        <Pressable
          accessibilityRole="button"
          className="min-h-[56px] flex-row items-center justify-center gap-2 rounded-2xl bg-brand-primary"
          onPress={handleNext}
        >
          <AppText className="text-base font-bold text-white">
            {hasPhotos ? 'Continuar para fotos' : hasExams ? 'Continuar para anexos' : 'Revisar e enviar'}
          </AppText>
          {hasPhotos ? (
            <Camera color="#FFFFFF" size={18} weight="bold" />
          ) : (
            <PaperPlaneTilt color="#FFFFFF" size={18} weight="bold" />
          )}
        </Pressable>
      </Animated.View>
    </AppScreen>
  );
}
