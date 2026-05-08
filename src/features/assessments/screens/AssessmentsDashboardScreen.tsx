import { SealCheck, WarningCircle, Clock, CaretRight } from 'phosphor-react-native';
import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';

import { AppShell } from '@/src/shared/components/layout/AppShell';
import { AppScreen } from '@/src/shared/components/ui/AppScreen';
import { AppText } from '@/src/shared/components/ui/AppText';
import { useAppTheme } from '@/src/shared/theme/appTheme';
import { useAuthStore } from '@/src/features/auth/services/auth.store';

import { AssessmentCard } from '../components/AssessmentCard';
import { createAssessmentDraft, useAssessmentsStore } from '../services/assessments.store';
import { AssessmentFilter } from '../types';
import { getAssessmentProgress, getStatusLabel, getStatusTone } from '../utils';
import { getStudentEvaluations } from '../api/assessments';

const filters: { label: string; value: AssessmentFilter }[] = [
  { label: 'Pendentes', value: 'pending' },
  { label: 'Em análise', value: 'analysis' },
  { label: 'Concluídas', value: 'done' },
  { label: 'Todas', value: 'all' },
];

export function AssessmentsDashboardScreen() {
  const { isDark } = useAppTheme();
  const [filter, setFilter] = useState<AssessmentFilter>('pending');
  const { session } = useAuthStore();
  const drafts = useAssessmentsStore((state) => state.drafts);

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => getStudentEvaluations(session?.token!),
    enabled: !!session?.token,
  });

  const urgentAssessment = useMemo(
    () =>
      assessments.find((a) => a.status === 'overdue') ??
      assessments.find((a) => a.status === 'pending') ??
      assessments.find((a) => a.status === 'scheduled') ??
      assessments[0],
    [assessments],
  );

  const filteredAssessments = useMemo(
    () =>
      assessments.filter((a) => {
        if (filter === 'all') return true;
        if (filter === 'done') return a.status === 'done';
        if (filter === 'analysis') return ['received', 'analysis', 'answered'].includes(a.status);
        return ['pending', 'sent', 'scheduled', 'overdue'].includes(a.status);
      }),
    [assessments, filter],
  );

  const pendingCount = assessments.filter((a) => ['pending', 'sent', 'scheduled', 'overdue'].includes(a.status)).length;
  const analysisCount = assessments.filter((a) => ['received', 'analysis', 'answered'].includes(a.status)).length;
  const doneCount = assessments.filter((a) => a.status === 'done').length;

  const urgentDraft = urgentAssessment
    ? (drafts[urgentAssessment.id] ?? createAssessmentDraft(urgentAssessment as any))
    : null;
  const urgentTone = urgentAssessment ? getStatusTone(urgentAssessment.status) : null;

  if (isLoading) {
    return (
      <AppScreen contentClassName="items-center justify-center">
        <ActivityIndicator size="large" color="#A78BFA" />
      </AppScreen>
    );
  }

  return (
    <AppShell title="Avaliações" contentClassName="pb-36">

      {/* ─── AVALIAÇÃO URGENTE ─────────────────── */}
      {urgentAssessment && urgentTone && urgentDraft && (
        <Animated.View entering={FadeInDown.delay(100).duration(600)} className="mb-8">
          <Pressable
            accessibilityRole="button"
            style={{
              borderRadius: 24,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: urgentTone.color + '30',
            }}
            onPress={() => router.push(`/(app)/assessments/${urgentAssessment.id}` as Href)}
          >
            {/* Tinted header */}
            <View style={{ backgroundColor: urgentTone.color + '0C', padding: 20, paddingBottom: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <View style={{
                  borderRadius: 99,
                  borderWidth: 1,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderColor: urgentTone.color + '40',
                  backgroundColor: urgentTone.color + '18',
                }}>
                  <AppText className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: urgentTone.color }}>
                    {getStatusLabel(urgentAssessment.status)}
                  </AppText>
                </View>
                <AppText className="text-xs font-bold text-text-muted">
                  {getAssessmentProgress(urgentAssessment as any, urgentDraft)}% enviado
                </AppText>
              </View>

              <AppText className="text-2xl font-bold leading-tight text-text-main mb-2">
                {urgentAssessment.title}
              </AppText>
              <AppText className="text-sm text-text-muted leading-relaxed">
                {urgentAssessment.status === 'answered' || urgentAssessment.status === 'done'
                  ? 'Parecer entregue. Veja os ajustes e próximos passos.'
                  : 'Sua equipe precisa dessas informações para ajustar treino, dieta e estratégia.'}
              </AppText>
            </View>

            {/* Bottom action bar */}
            <View style={{
              backgroundColor: isDark ? '#111111' : '#F5F5F5',
              paddingHorizontal: 20,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <AppText className="text-sm font-bold text-text-muted">
                {urgentAssessment.status === 'done' || urgentAssessment.status === 'answered'
                  ? 'Ver parecer'
                  : 'Continuar avaliação'}
              </AppText>
              <CaretRight color="#555" size={14} weight="bold" />
            </View>
          </Pressable>
        </Animated.View>
      )}

      {/* ─── RESUMO ────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(200).duration(600)} className="mb-8">
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <SummaryCard icon={WarningCircle} label="pendentes" value={String(pendingCount)} tone="warning" />
          <SummaryCard icon={Clock} label="em análise" value={String(analysisCount)} />
          <SummaryCard icon={SealCheck} label="concluídas" value={String(doneCount)} tone="success" />
        </View>
      </Animated.View>

      {/* ─── FILTROS ───────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(300).duration(600)} className="mb-8">
        <View className="flex-row items-center justify-between border-b border-border-subtle pb-4 mb-4">
          <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">
            Histórico
          </AppText>
          <AppText className="text-xs text-text-muted">{filteredAssessments.length} itens</AppText>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {filters.map((item) => (
            <Pressable
              key={item.value}
              accessibilityRole="button"
              style={{
                flex: 1,
                minHeight: 38,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: filter === item.value ? '#8B5CF6' : 'transparent',
                backgroundColor: filter === item.value ? '#8B5CF618' : (isDark ? '#1A1A1A' : '#F0F0F0'),
              }}
              onPress={() => setFilter(item.value)}
            >
              <AppText
                className="text-[11px] font-bold"
                style={{ color: filter === item.value ? '#A78BFA' : '#666' }}
              >
                {item.label}
              </AppText>
            </Pressable>
          ))}
        </View>

        <View style={{ gap: 10 }}>
          {filteredAssessments.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment as any}
              draft={drafts[assessment.id] ?? createAssessmentDraft(assessment as any)}
              onPress={() => router.push(`/(app)/assessments/${assessment.id}` as Href)}
            />
          ))}
          {filteredAssessments.length === 0 && (
            <AppText className="py-10 text-center text-sm text-text-muted">
              Nenhuma avaliação encontrada.
            </AppText>
          )}
        </View>
      </Animated.View>
    </AppShell>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone = 'brand',
}: {
  icon: typeof WarningCircle;
  label: string;
  value: string;
  tone?: 'brand' | 'success' | 'warning';
}) {
  const color = tone === 'success' ? '#34D399' : tone === 'warning' ? '#FCD34D' : '#A78BFA';

  return (
    <View className="flex-1 rounded-[20px] border border-border-subtle bg-bg-surface p-4">
      <Icon color={color} size={20} weight="duotone" />
      <AppText className="mt-3 text-xl font-bold text-text-main">{value}</AppText>
      <AppText className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-text-muted">{label}</AppText>
    </View>
  );
}
