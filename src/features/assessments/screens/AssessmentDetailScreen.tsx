import { ArrowLeft, Camera, ClipboardText, FileText, Flask, PaperPlaneTilt, SealCheck } from 'phosphor-react-native';
import { router, type Href, useLocalSearchParams } from 'expo-router';
import { Pressable, View, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { AppScreen } from '@/src/shared/components/ui/AppScreen';
import { AppText } from '@/src/shared/components/ui/AppText';
import { cn } from '@/src/shared/utils/cn';
import { useAppTheme } from '@/src/shared/theme/appTheme';
import { useAuthStore } from '@/src/features/auth/services/auth.store';

import { AssessmentTaskCard } from '../components/AssessmentTaskCard';
import { createAssessmentDraft, useAssessmentsStore } from '../services/assessments.store';
import { getEvaluationById } from '../api/assessments';
import {
  canSubmitAssessment,
  getExamProgress,
  getPhotoProgress,
  getQuestionnaireProgress,
  getRequiredMissing,
  getStatusLabel,
  getStatusTone,
  cleanText,
} from '../utils';

export function AssessmentDetailScreen() {
  const { isDark } = useAppTheme();
  const { assessmentId } = useLocalSearchParams<{ assessmentId: string }>();
  const { session } = useAuthStore();
  const { data: assessment, isLoading, error } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => getEvaluationById(session?.token!, assessmentId!),
    enabled: !!session?.token && !!assessmentId,
  });

  const drafts = useAssessmentsStore((state) => state.drafts);
  const initializeDraft = useAssessmentsStore((state) => state.initializeDraft);

  useEffect(() => {
    if (assessment) {
      initializeDraft(assessment as any);
    }
  }, [assessment, initializeDraft]);

  if (isLoading) {
    return (
      <AppScreen contentClassName="items-center justify-center">
        <ActivityIndicator size="large" color="#A78BFA" />
      </AppScreen>
    );
  }

  if (error || !assessment) {
    return (
      <AppScreen contentClassName="px-5 pt-5">
        <View className="mb-10 flex-row items-center">
          <Pressable
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-full bg-bg-surface border border-border-subtle"
            onPress={() => router.back()}
          >
            <ArrowLeft color={isDark ? '#FFFFFF' : '#111827'} size={20} weight="bold" />
          </Pressable>
        </View>
        <View className="items-center justify-center flex-1 px-5">
          <AppText className="text-center text-base text-text-muted">
            Não foi possível carregar a avaliação.
          </AppText>
          <Pressable
            accessibilityRole="button"
            className="mt-5 min-h-[48px] px-6 items-center justify-center rounded-2xl bg-bg-surface border border-border-subtle"
            onPress={() => router.back()}
          >
            <AppText className="text-sm font-bold text-text-main">Voltar</AppText>
          </Pressable>
        </View>
      </AppScreen>
    );
  }

  const draft = drafts[assessment.id] ?? createAssessmentDraft(assessment as any);
  const statusTone = getStatusTone(assessment.status);
  const questionnaire = getQuestionnaireProgress(assessment as any, draft);
  const photos = getPhotoProgress(assessment as any, draft);
  const exams = getExamProgress(assessment as any, draft);
  const missing = getRequiredMissing(assessment as any, draft);
  const isScheduled = assessment.status === 'scheduled';
  const isSubmitted =
    assessment.status === 'analysis' ||
    assessment.status === 'answered' ||
    assessment.status === 'done' ||
    draft.submitted;
  const readOnly = isScheduled || isSubmitted;

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
        <AppText className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">
          v{assessment.plan ?? '1'}
        </AppText>
        <View className="h-11 w-11" />
      </View>

      <Animated.View entering={FadeInDown.duration(420)}>
        {/* Hero card */}
        <View className="mb-6 overflow-hidden rounded-[28px] border border-border-subtle bg-bg-surface p-5">
          <View className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-brand-primary/10" />
          <View className={cn('mb-4 self-start rounded-full border px-3 py-1', statusTone.bg, statusTone.border)}>
            <AppText className={cn('text-[11px] font-bold uppercase tracking-wide', statusTone.text)}>
              {getStatusLabel(assessment.status)}
            </AppText>
          </View>
          <AppText className="text-2xl font-bold leading-tight text-text-main">
            {assessment.title.includes('Acompanhamento')
              ? assessment.questionnaire.title
              : assessment.title}
          </AppText>
          <AppText className="mt-2 text-sm leading-relaxed text-text-muted">
            {cleanText(assessment.questionnaire.description || assessment.category)}
            {assessment.plan ? ` · ${assessment.plan}` : ''}
          </AppText>

          <View className="mt-5 gap-2.5">
            <InfoRow label="Responsável" value={assessment.professional?.name || 'Equipe'} />
            {assessment.mesocycle && <InfoRow label="Mesociclo" value={assessment.mesocycle} />}
            <InfoRow label="Prazo" value="10 dias" />
          </View>
        </View>
      </Animated.View>

      {/* Checklist */}
      <Animated.View entering={FadeInDown.delay(80).duration(420)} className="gap-3">
        <View className="flex-row items-center justify-between border-b border-border-subtle pb-4 mb-1">
          <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">
            Checklist
          </AppText>
        </View>

        <AssessmentTaskCard
          description={cleanText(assessment.questionnaire.description)}
          done={isSubmitted || questionnaire.percent === 100}
          disabled={isScheduled || isSubmitted}
          icon={ClipboardText}
          progressLabel={isSubmitted ? 'Respondido' : `${questionnaire.answered}/${questionnaire.total}`}
          title="Responder questionário"
          urgent={!isSubmitted && missing.length > 0}
          onPress={() => router.push(`/(app)/assessments/${assessment.id}/questionnaire` as Href)}
        />
        {assessment.questionnaire.image_questions.length > 0 && (
          <AssessmentTaskCard
            description="Fotos frontais, laterais e costas com enquadramento padronizado."
            done={isSubmitted || photos.done === photos.total}
            disabled={isScheduled || isSubmitted}
            icon={Camera}
            progressLabel={isSubmitted ? 'Enviado' : `${photos.done}/${photos.total}`}
            title="Fotos corporais"
            urgent={!isSubmitted && photos.done < photos.total}
            onPress={() => router.push(`/(app)/assessments/${assessment.id}/photos` as Href)}
          />
        )}
        {assessment.questionnaire.attachment_questions.length > 0 && (
          <AssessmentTaskCard
            description="Anexe os exames solicitados ou documentos relevantes."
            done={isSubmitted || exams.done === exams.total}
            disabled={isScheduled || isSubmitted}
            icon={Flask}
            progressLabel={isSubmitted ? 'Enviado' : `${exams.done}/${exams.total}`}
            title="Exames e anexos"
            urgent={!isSubmitted && exams.done < exams.total}
            onPress={() => router.push(`/(app)/assessments/${assessment.id}/exams` as Href)}
          />
        )}
        <AssessmentTaskCard
          description={
            assessment.result?.deliveredAt
              ? 'Parecer entregue pela equipe com ajustes e próximos passos.'
              : isSubmitted
                ? 'Aguardando análise da equipe para liberar o parecer.'
                : 'Aguardando o envio do questionário para análise.'
          }
          done={!!assessment.result?.deliveredAt}
          urgent={!assessment.result?.deliveredAt && isSubmitted}
          neutral={!assessment.result?.deliveredAt && !isSubmitted}
          icon={SealCheck}
          progressLabel={
            assessment.result?.deliveredAt
              ? `Respondido em ${assessment.result.deliveredAt}`
              : isSubmitted
                ? 'Em análise'
                : 'Aguardando envio'
          }
          title="Parecer final"
          disabled={!assessment.result?.deliveredAt}
          onPress={() =>
            assessment.result?.deliveredAt &&
            router.push(`/(app)/assessments/${assessment.id}/result` as Href)
          }
        />
      </Animated.View>

      {/* CTA */}
      <Animated.View entering={FadeInDown.delay(140).duration(420)} className="mt-7">
        {assessment.status === 'answered' || assessment.status === 'done' ? (
          <Pressable
            accessibilityRole="button"
            className="min-h-[56px] flex-row items-center justify-center gap-2 rounded-2xl bg-brand-primary"
            onPress={() => router.push(`/(app)/assessments/${assessment.id}/result` as Href)}
          >
            <AppText className="text-base font-bold text-white">Ver parecer final</AppText>
            <FileText color="#FFFFFF" size={18} weight="bold" />
          </Pressable>
        ) : isScheduled ? (
          <View className="rounded-[24px] border border-amber-400/20 bg-amber-400/8 p-5">
            <AppText className="text-base font-bold text-text-main">Ainda não liberada</AppText>
            <AppText className="mt-2 text-sm leading-relaxed text-text-muted">
              Esta avaliação está agendada. Quando chegar a data, o questionário e as fotos ficam disponíveis.
            </AppText>
            <AppText className="mt-4 text-sm font-bold text-amber-400">
              Libera: {assessment.due_date}
            </AppText>
          </View>
        ) : readOnly ? (
          <View className="rounded-[24px] border border-brand-primary/25 bg-brand-primary/8 p-5">
            <AppText className="text-base font-bold text-text-main">Equipe analisando</AppText>
            <AppText className="mt-2 text-sm leading-relaxed text-text-muted">
              Seu envio foi recebido. A equipe revisa questionário, fotos e anexos antes de liberar o parecer.
            </AppText>
            <AppText className="mt-4 text-sm font-bold text-brand-secondary">
              Previsão: até 24h úteis
            </AppText>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            className="min-h-[56px] flex-row items-center justify-center gap-2 rounded-2xl bg-brand-primary"
            onPress={() => router.push(`/(app)/assessments/${assessment.id}/review` as Href)}
          >
            <AppText className="text-base font-bold text-white">Revisar e enviar</AppText>
            <PaperPlaneTilt color="#FFFFFF" size={18} weight="bold" />
          </Pressable>
        )}
      </Animated.View>
    </AppScreen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4 border-t border-border-subtle pt-3">
      <AppText className="text-sm text-text-muted">{label}</AppText>
      <AppText className="max-w-[64%] text-right text-sm font-bold text-text-main">{value}</AppText>
    </View>
  );
}
