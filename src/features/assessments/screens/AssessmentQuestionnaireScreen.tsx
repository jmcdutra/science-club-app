import { ArrowLeft, ArrowUp, Camera, PaperPlaneTilt } from 'phosphor-react-native';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, View, type ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { AppScreen } from '@/src/shared/components/ui/AppScreen';
import { AppButton } from '@/src/shared/components/ui/AppButton';
import { AppText } from '@/src/shared/components/ui/AppText';
import { useAuthStore } from '@/src/features/auth/services/auth.store';
import { useRefetchOnFocus } from '@/src/shared/hooks/useRefetchOnFocus';

import { AssessmentFieldRenderer } from '../components/AssessmentFieldRenderer';
import { createAssessmentDraft, useAssessmentsStore } from '../services/assessments.store';
import { getQuestionnaireProgress, getRequiredMissing, cleanText } from '../utils';
import { getEvaluationById } from '../api/assessments';

const QUESTIONS_PER_STEP = 10;

export function AssessmentQuestionnaireScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { assessmentId } = useLocalSearchParams<{ assessmentId: string }>();
  const { session } = useAuthStore();
  const drafts = useAssessmentsStore((state) => state.drafts);
  const setAnswer = useAssessmentsStore((state) => state.setAnswer);
  const toggleCheckboxAnswer = useAssessmentsStore((state) => state.toggleCheckboxAnswer);
  const initializeDraft = useAssessmentsStore((state) => state.initializeDraft);
  const [questionStep, setQuestionStep] = useState(0);

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
  const progress = getQuestionnaireProgress(assessment as any, draft);
  const missingCount = getRequiredMissing(assessment as any, draft).length;
  const isSubmitted =
    assessment.status === 'analysis' ||
    assessment.status === 'answered' ||
    assessment.status === 'done' ||
    draft.submitted;

  const hasPhotos = assessment.questionnaire.image_questions.length > 0;
  const hasExams = assessment.questionnaire.attachment_questions.length > 0;
  const questions = assessment.questionnaire.questions;
  const totalSteps = Math.max(1, Math.ceil(questions.length / QUESTIONS_PER_STEP));
  const currentStep = Math.min(questionStep, totalSteps - 1);
  const visibleQuestions = questions.slice(currentStep * QUESTIONS_PER_STEP, (currentStep + 1) * QUESTIONS_PER_STEP);
  const stepStart = currentStep * QUESTIONS_PER_STEP + 1;
  const stepEnd = Math.min((currentStep + 1) * QUESTIONS_PER_STEP, questions.length);

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setQuestionStep((step) => Math.min(step + 1, totalSteps - 1));
      requestAnimationFrame(scrollToTop);
      return;
    }

    if (hasPhotos) {
      router.push(`/(app)/assessments/${assessment.id}/photos` as Href);
    } else if (hasExams) {
      router.push(`/(app)/assessments/${assessment.id}/exams` as Href);
    } else {
      router.push(`/(app)/assessments/${assessment.id}/review` as Href);
    }
  };

  const nextLabel = currentStep < totalSteps - 1
    ? `Próximas ${Math.min(QUESTIONS_PER_STEP, questions.length - stepEnd)} perguntas`
    : hasPhotos
    ? 'Continuar para fotos'
    : hasExams
      ? 'Continuar para exames'
      : 'Revisar e enviar';

  const NextIcon = hasPhotos && currentStep === totalSteps - 1 ? Camera : PaperPlaneTilt;

  return (
    <AppScreen
      contentClassName="px-6 pb-8 pt-5"
      keyboard
      scrollRef={scrollRef}
      floatingChildren={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar ao topo"
          onPress={scrollToTop}
          style={{
            position: 'absolute',
            right: 18,
            bottom: 28,
            width: 46,
            height: 46,
            borderRadius: 99,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#8B5CF6',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.18)',
          }}
        >
          <ArrowUp color="#FFFFFF" size={20} weight="bold" />
        </Pressable>
      }
    >
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
          Questionário
        </AppText>
        <View style={{ width: 44 }} />
      </View>

      <Animated.View entering={FadeInDown.duration(400)}>
        {/* ── Editorial heading ── */}
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
          {assessment.questionnaire.title}
        </AppText>
        {assessment.questionnaire.description ? (
          <AppText style={{ fontSize: 13, color: '#666666', lineHeight: 18, marginBottom: 20 }}>
            {cleanText(assessment.questionnaire.description)}
          </AppText>
        ) : (
          <View style={{ marginBottom: 20 }} />
        )}

        {/* ── Progress strip ── */}
        <View style={{ marginBottom: 28 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <AppText style={{ fontSize: 12, fontWeight: '600', color: '#666666' }}>
              {progress.answered} de {progress.total} respondidas
            </AppText>
            {missingCount > 0 && !isSubmitted ? (
              <AppText style={{ fontSize: 11, fontWeight: '700', color: '#FBBF24' }}>
                {missingCount} obrigatória{missingCount > 1 ? 's' : ''} faltando
              </AppText>
            ) : (
              <AppText style={{ fontSize: 11, fontWeight: '700', color: '#8B5CF6' }}>
                {progress.percent}%
              </AppText>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 2 }}>
            {Array.from({ length: Math.max(progress.total, 1) }).map((_, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 99,
                  backgroundColor: i < progress.answered ? '#8B5CF6' : '#1A1A1A',
                }}
              />
            ))}
          </View>
          {questions.length > QUESTIONS_PER_STEP ? (
            <View
              style={{
                marginTop: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <AppText style={{ fontSize: 12, fontWeight: '700', color: '#A78BFA' }}>
                Etapa {currentStep + 1} de {totalSteps}
              </AppText>
              <AppText style={{ fontSize: 12, color: '#666666' }}>
                Perguntas {stepStart}-{stepEnd}
              </AppText>
            </View>
          ) : null}
        </View>
      </Animated.View>

      {/* ── Fields ── */}
      <Animated.View
        entering={FadeInDown.delay(80).duration(400)}
        style={{ gap: 10, marginBottom: 24, opacity: isSubmitted ? 0.6 : 1 }}
      >
        {visibleQuestions.map((field) => (
          <AssessmentFieldRenderer
            key={field.id}
            field={field as any}
            value={draft.answers[field.id]}
            onChange={(value) => !isSubmitted && setAnswer(assessment.id, field.id, value)}
            onToggleOption={(option) =>
              !isSubmitted && toggleCheckboxAnswer(assessment.id, field.id, option)
            }
          />
        ))}
      </Animated.View>

      {/* ── CTA ── */}
      <Animated.View entering={FadeInDown.delay(160).duration(400)} style={{ gap: 10 }}>
        {currentStep > 0 ? (
          <AppButton
            variant="secondary"
            fullWidth
            onPress={() => {
              setQuestionStep((step) => Math.max(0, step - 1));
              requestAnimationFrame(scrollToTop);
            }}
          >
            <AppText style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
              Perguntas anteriores
            </AppText>
          </AppButton>
        ) : null}
        <AppButton
          variant="primary"
          fullWidth
          onPress={handleNext}
          rightIcon={<NextIcon color="#fff" size={18} weight="bold" />}
        >
          <AppText style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{nextLabel}</AppText>
        </AppButton>
      </Animated.View>

    </AppScreen>
  );
}
