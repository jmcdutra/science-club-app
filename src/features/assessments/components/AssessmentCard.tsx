import { CaretRight, CheckCircle, Clock } from 'phosphor-react-native';
import { Pressable, View } from 'react-native';

import { AppText } from '@/src/shared/components/ui/AppText';

import { Assessment, AssessmentDraft } from '../types';
import { formatAssessmentDate, getAssessmentProgress, getStatusLabel, getStatusTone } from '../utils';

type AssessmentCardProps = {
  assessment: Assessment;
  draft: AssessmentDraft;
  onPress: () => void;
};

export function AssessmentCard({ assessment, draft, onPress }: AssessmentCardProps) {
  const tone = getStatusTone(assessment.status);
  const isSubmitted = ['analysis', 'answered', 'done'].includes(assessment.status);
  const isDone = assessment.status === 'done';
  const isScheduled = assessment.status === 'scheduled';
  const progress = isSubmitted ? 100 : getAssessmentProgress(assessment, draft);

  const actionLabel = isDone
    ? 'Ver parecer'
    : isSubmitted
      ? 'Em análise'
      : isScheduled
        ? 'Agendada'
        : progress > 0
          ? 'Continuar'
          : 'Começar';

  /* ── Build meta string ── */
  const metaParts: string[] = [];
  if (assessment.mesocycle) metaParts.push(assessment.mesocycle);
  if (assessment.due_date) {
    const normalizedDate = formatAssessmentDate(assessment.due_date);
    metaParts.push(isScheduled ? `Libera em ${normalizedDate}` : normalizedDate);
  }
  if (assessment.professional?.name) metaParts.push(assessment.professional.name);
  const meta = metaParts.join(' · ') || 'Equipe Science Club';

  /* ── Icon ── */
  const StatusIcon = isDone ? CheckCircle : isScheduled ? Clock : null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: '#111111',
        borderWidth: 1,
        borderColor: '#222222',
        borderRadius: 16,
        padding: 14,
      }}
    >
      {/* ── Icon halo ── */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: `${tone.color}12`,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {StatusIcon ? (
          <StatusIcon size={22} color={tone.color} weight="fill" />
        ) : (
          <>
            {/* Status dot */}
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 99,
                backgroundColor: tone.color,
              }}
            />
          </>
        )}
      </View>

      {/* ── Content ── */}
      <View style={{ flex: 1 }}>
        {/* Title */}
        <AppText
          className="font-heading"
          style={{
            fontSize: 15,
            fontWeight: '600',
            letterSpacing: -0.3,
            color: '#FFFFFF',
            lineHeight: 20,
            marginBottom: 3,
          }}
          numberOfLines={1}
        >
          {assessment.title}
        </AppText>

        {/* Meta row: status label · meta info */}
        <AppText
          style={{ fontSize: 11, color: '#666666', lineHeight: 16 }}
          numberOfLines={1}
        >
          {getStatusLabel(assessment.status)} · {meta}
        </AppText>

        {/* Action / progress */}
        {!isDone && !isScheduled && !isSubmitted && progress > 0 && (
          <View style={{ marginTop: 8, height: 2, borderRadius: 99, backgroundColor: '#1A1A1A' }}>
            <View
              style={{
                height: 2,
                borderRadius: 99,
                backgroundColor: tone.color,
                width: `${progress}%`,
                opacity: 0.65,
              }}
            />
          </View>
        )}
      </View>

      {/* ── Trailing ── */}
      <View style={{ alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
        <AppText
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: tone.color,
          }}
        >
          {actionLabel}
        </AppText>
        <CaretRight size={12} color="#444444" weight="bold" />
      </View>
    </Pressable>
  );
}
