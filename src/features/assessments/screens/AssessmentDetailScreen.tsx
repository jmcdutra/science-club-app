import {
  ArrowLeft,
  Camera,
  ClipboardText,
  FileText,
  Flask,
  PaperPlaneTilt,
  SealCheck,
  CheckCircle,
  WarningCircle,
  CaretRight,
} from 'phosphor-react-native';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { AppScreen } from '@/src/shared/components/ui/AppScreen';
import { AppButton } from '@/src/shared/components/ui/AppButton';
import { AppText } from '@/src/shared/components/ui/AppText';
import { useAuthStore } from '@/src/features/auth/services/auth.store';
import { useRefetchOnFocus } from '@/src/shared/hooks/useRefetchOnFocus';

import { createAssessmentDraft, useAssessmentsStore } from '../services/assessments.store';
import { getEvaluationById } from '../api/assessments';
import {
  getExamProgress,
  getPhotoProgress,
  getQuestionnaireProgress,
  getRequiredMissing,
  getStatusLabel,
  getStatusTone,
  cleanText,
  formatAssessmentDate,
  formatAssessmentDateTime,
  getResponsibleProfessionals,
} from '../utils';

/* ─── Task Row ───────────────────────────────────────────────────────────── */

type TaskRowProps = {
  icon: typeof ClipboardText;
  title: string;
  detail: string;
  done: boolean;
  urgent?: boolean;
  neutral?: boolean;
  disabled?: boolean;
  onPress?: () => void;
};

function TaskRow({ icon: Icon, title, detail, done, urgent, neutral, disabled, onPress }: TaskRowProps) {
  const iconColor = done ? '#34D399' : urgent ? '#FCD34D' : neutral ? '#555555' : '#A78BFA';
  const iconBg = done
    ? 'rgba(52,211,153,0.10)'
    : urgent
      ? 'rgba(252,211,77,0.10)'
      : neutral
        ? 'rgba(255,255,255,0.04)'
        : 'rgba(139,92,246,0.10)';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#111111',
        borderWidth: 1,
        borderColor: '#222222',
        borderRadius: 16,
        padding: 14,
        opacity: disabled && !done ? 0.55 : 1,
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
          flexShrink: 0,
        }}
      >
        <Icon size={20} color={iconColor} weight="duotone" />
      </View>

      <View style={{ flex: 1 }}>
        <AppText style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginBottom: 2 }}>
          {title}
        </AppText>
        <AppText style={{ fontSize: 11, color: '#666666' }}>{detail}</AppText>
      </View>

      {done ? (
        <CheckCircle size={16} color="#34D399" weight="fill" />
      ) : urgent ? (
        <WarningCircle size={16} color="#FCD34D" weight="fill" />
      ) : !disabled ? (
        <CaretRight size={14} color="#444444" weight="bold" />
      ) : null}
    </Pressable>
  );
}

/* ─── Screen ─────────────────────────────────────────────────────────────── */

export function AssessmentDetailScreen() {
  const router = useRouter();
  const { assessmentId } = useLocalSearchParams<{ assessmentId: string }>();
  const { session } = useAuthStore();
  const { data: assessment, isLoading, error, refetch } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => getEvaluationById(session?.token!, assessmentId!),
    enabled: !!session?.token && !!assessmentId,
  });
  useRefetchOnFocus(refetch, Boolean(session?.token && assessmentId));

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
      <AppScreen contentClassName="px-6 pt-5">
        <Pressable
          accessibilityRole="button"
          style={{
            width: 44, height: 44, borderRadius: 99,
            backgroundColor: '#111111', borderWidth: 1, borderColor: '#222222',
            alignItems: 'center', justifyContent: 'center', marginBottom: 40,
          }}
          onPress={() => router.back()}
        >
          <ArrowLeft color="#FFFFFF" size={20} weight="bold" />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <AppText style={{ textAlign: 'center', fontSize: 14, color: '#666666', marginBottom: 20 }}>
            Não foi possível carregar a avaliação.
          </AppText>
          <AppButton variant="secondary" onPress={() => router.back()}>
            <AppText style={{ color: '#EDEDED', fontWeight: '600', fontSize: 14 }}>Voltar</AppText>
          </AppButton>
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

  const assessmentTitle = assessment.title.includes('Acompanhamento')
    ? assessment.questionnaire.title
    : assessment.title;

  const description = cleanText(assessment.questionnaire.description || assessment.category);
  const responsibleNames = getResponsibleProfessionals(assessment);

  const meta = [
    responsibleNames.length > 0
      ? responsibleNames.join(' • ')
      : 'Equipe Science Club',
    assessment.due_date && `${isScheduled ? 'Liberação' : 'Prazo'}: ${isScheduled ? formatAssessmentDateTime(assessment.due_date) : formatAssessmentDate(assessment.due_date)}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <AppScreen contentClassName="px-6 pb-12 pt-5">
      {/* ── Back bar ── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28,
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
          Avaliação
        </AppText>
        <View style={{ width: 44 }} />
      </View>

      {/* ── Editorial header — no card wrapper ── */}
      <Animated.View entering={FadeInDown.duration(420)} style={{ marginBottom: 28 }}>
        {/* Status chip */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginBottom: 14,
          }}
        >
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 99,
              backgroundColor: statusTone.color,
            }}
          />
          <AppText
            style={{
              fontSize: 10,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 2,
              color: statusTone.color,
            }}
          >
            {getStatusLabel(assessment.status)}
          </AppText>
        </View>

        {/* Title */}
        <AppText
          className="font-heading"
          style={{
            fontSize: 24,
            fontWeight: '600',
            letterSpacing: -0.5,
            color: '#FFFFFF',
            lineHeight: 30,
            marginBottom: 8,
          }}
        >
          {assessmentTitle}
        </AppText>

        {/* Description */}
        {description ? (
          <AppText
            style={{ fontSize: 14, color: '#666666', lineHeight: 21, marginBottom: 14 }}
          >
            {description}
          </AppText>
        ) : null}

        {/* Meta */}
        <AppText style={{ fontSize: 12, color: '#3A3A3A' }}>{meta}</AppText>

        {/* Accent line */}
        <View
          style={{
            width: 28,
            height: 2,
            backgroundColor: statusTone.color,
            borderRadius: 99,
            marginTop: 18,
            opacity: 0.6,
          }}
        />
      </Animated.View>

      {/* ── Checklist ── */}
      <Animated.View entering={FadeInDown.delay(80).duration(420)} style={{ marginBottom: 24 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: '#1A1A1A',
            paddingBottom: 10,
            marginBottom: 12,
          }}
        >
          <AppText
            style={{
              fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
              letterSpacing: 3.5, color: '#555555',
            }}
          >
            Checklist
          </AppText>
        </View>

        <View style={{ gap: 8 }}>
          <TaskRow
            icon={ClipboardText}
            title="Questionário"
            detail={isSubmitted ? 'Respondido' : `${questionnaire.answered} de ${questionnaire.total} perguntas`}
            done={isSubmitted || questionnaire.percent === 100}
            urgent={!isSubmitted && missing.length > 0}
            disabled={isScheduled || isSubmitted}
            onPress={() => router.push(`/(app)/assessments/${assessment.id}/questionnaire` as Href)}
          />

          {assessment.questionnaire.image_questions.length > 0 && (
            <TaskRow
              icon={Camera}
              title="Fotos corporais"
              detail={isSubmitted ? 'Enviado' : `${photos.done} de ${photos.total} posições`}
              done={isSubmitted || photos.done === photos.total}
              urgent={!isSubmitted && photos.done < photos.total}
              disabled={isScheduled || isSubmitted}
              onPress={() => router.push(`/(app)/assessments/${assessment.id}/photos` as Href)}
            />
          )}

          {assessment.questionnaire.attachment_questions.length > 0 && (
            <TaskRow
              icon={Flask}
              title="Exames e anexos"
              detail={isSubmitted ? 'Enviado' : `${exams.done} de ${exams.total} documentos`}
              done={isSubmitted || exams.done === exams.total}
              urgent={!isSubmitted && exams.done < exams.total}
              disabled={isScheduled || isSubmitted}
              onPress={() => router.push(`/(app)/assessments/${assessment.id}/exams` as Href)}
            />
          )}

          <TaskRow
            icon={SealCheck}
            title="Parecer final"
            detail={
              assessment.result?.deliveredAt
                ? `Entregue em ${formatAssessmentDateTime(assessment.result.deliveredAt)}`
                : isSubmitted
                  ? 'Parecer pendente'
                  : 'Aguardando envio'
            }
            done={!!assessment.result?.deliveredAt}
            urgent={!assessment.result?.deliveredAt && isSubmitted}
            neutral={!assessment.result?.deliveredAt && !isSubmitted}
            disabled={!assessment.result?.deliveredAt && !isSubmitted}
            onPress={() =>
              (assessment.result?.deliveredAt || isSubmitted) &&
              router.push(`/(app)/assessments/${assessment.id}/result` as Href)
            }
          />
        </View>
      </Animated.View>

      {/* ── CTA ── */}
      <Animated.View entering={FadeInDown.delay(140).duration(420)}>
        {assessment.status === 'answered' || assessment.status === 'done' ? (
          <AppButton
            variant="primary"
            fullWidth
            onPress={() => router.push(`/(app)/assessments/${assessment.id}/result` as Href)}
            rightIcon={<FileText color="#fff" size={18} weight="bold" />}
          >
            <AppText style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
              Ver parecer final
            </AppText>
          </AppButton>
        ) : isScheduled ? (
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(251,191,36,0.15)',
              backgroundColor: 'rgba(251,191,36,0.06)',
              padding: 16,
            }}
          >
            <AppText style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 }}>
              Ainda não liberada
            </AppText>
            <AppText style={{ fontSize: 12, color: '#666666', lineHeight: 17, marginBottom: 10 }}>
              Esta avaliação está agendada. Quando chegar a data, o questionário e as fotos ficam
              disponíveis.
            </AppText>
            <AppText style={{ fontSize: 12, fontWeight: '700', color: '#FBBF24' }}>
              Libera: {assessment.due_date}
            </AppText>
          </View>
        ) : readOnly ? (
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(139,92,246,0.15)',
              backgroundColor: 'rgba(139,92,246,0.06)',
              padding: 16,
            }}
          >
            <AppText style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 }}>
              Equipe analisando
            </AppText>
            <AppText style={{ fontSize: 12, color: '#666666', lineHeight: 17, marginBottom: 10 }}>
              Seu envio foi recebido. A equipe revisa tudo antes de liberar o parecer.
            </AppText>
            <AppText style={{ fontSize: 12, fontWeight: '700', color: '#A78BFA' }}>
              Previsão: até 24h úteis
            </AppText>
          </View>
        ) : (
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
        )}
      </Animated.View>
    </AppScreen>
  );
}
