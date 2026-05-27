import { type Href, useRouter } from 'expo-router';
import { type ReactNode, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CaretDown, CaretRight, CheckCircle, Drop, ForkKnife } from 'phosphor-react-native';

import { AppText } from '@/src/shared/components/ui/AppText';
import { NotificationsModal } from '@/src/shared/components/ui/NotificationsModal';
import { useAuthStore } from '@/src/features/auth/services/auth.store';
import { PageHeader } from '@/src/shared/components/layout/PageHeader';
import { useRefetchOnFocus } from '@/src/shared/hooks/useRefetchOnFocus';
import { getCurrentDiet, getDietAdherence } from '@/src/features/diet/api/diet';
import type { DietAdherenceDay, DietFood, MealStatus } from '@/src/features/diet/types';
import { getMealConsumedMacros, getMealLog, getMealStatus } from '@/src/features/diet/utils';
import { getCurrentWorkout } from '@/src/features/workouts/api/workouts';
import type { WorkoutHistorySetDTO, WorkoutSessionHistoryDTO } from '@/src/features/workouts/api/workouts';

import { AssessmentCard } from '../components/AssessmentCard';
import { getStudentEvaluations } from '../api/assessments';
import { createAssessmentDraft, useAssessmentsStore } from '../services/assessments.store';
import { AssessmentStatus } from '../types';

const PHOTO_POSITION_PRIORITY = ['double_biceps_front', 'relax_front'] as const;

const STATUS_SORT: Record<AssessmentStatus, number> = {
  overdue: 0,
  pending: 1,
  sent: 2,
  received: 3,
  analysis: 4,
  answered: 5,
  scheduled: 6,
  done: 7,
};

const pickPreferredPhoto = (
  assessment?: { photos?: { url: string; position?: string; label?: string }[] } | null,
  excludedUrls: string[] = [],
) => {
  const photos = (assessment?.photos || []).filter((photo) => photo?.url && !excludedUrls.includes(photo.url));
  if (!photos.length) return null;

  for (const position of PHOTO_POSITION_PRIORITY) {
    const match = photos.find((photo) => photo.position === position);
    if (match) return match;
  }

  return photos[0];
};

const formatDateLabel = (value?: string | null) => {
  if (!value) return 'Sem data';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
};

const formatDateTimeLabel = (value?: string | null) => {
  if (!value) return 'Sem registro';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatAssessmentStatus = (status: AssessmentStatus) => {
  switch (status) {
    case 'overdue':
      return 'Atrasada';
    case 'pending':
      return 'Pendente';
    case 'sent':
      return 'Enviada';
    case 'received':
      return 'Recebida';
    case 'analysis':
      return 'Em análise';
    case 'answered':
      return 'Respondida';
    case 'scheduled':
      return 'Agendada';
    case 'done':
      return 'Concluída';
    default:
      return status;
  }
};

const getStatusTone = (status: AssessmentStatus) => {
  switch (status) {
    case 'overdue':
      return { backgroundColor: 'rgba(248,113,113,0.16)', color: '#FCA5A5' };
    case 'pending':
    case 'sent':
    case 'received':
    case 'analysis':
    case 'answered':
      return { backgroundColor: 'rgba(139,92,246,0.16)', color: '#C4B5FD' };
    case 'scheduled':
      return { backgroundColor: 'rgba(56,189,248,0.16)', color: '#7DD3FC' };
    case 'done':
      return { backgroundColor: 'rgba(34,197,94,0.16)', color: '#86EFAC' };
    default:
      return { backgroundColor: 'rgba(113,113,122,0.16)', color: '#D4D4D8' };
  }
};

const MEAL_STATUS_META: Record<MealStatus, { label: string; accent: string; background: string }> = {
  pending: { label: 'Planejada', accent: '#A1A1AA', background: 'rgba(255,255,255,0.06)' },
  partial: { label: 'Parcial', accent: '#FBBF24', background: 'rgba(251,191,36,0.12)' },
  done: { label: 'Concluída', accent: '#86EFAC', background: 'rgba(34,197,94,0.16)' },
  skipped: { label: 'Pulada', accent: '#FDA4AF', background: 'rgba(244,63,94,0.14)' },
};

const formatShortMacro = (value: number, suffix = 'g') => `${Math.round(value || 0)}${suffix}`;

const formatKgLabel = (value: number) => `${Number(value || 0).toLocaleString('pt-BR')} kg`;

const getTrimmedText = (value?: string | null) => {
  const normalized = String(value ?? '').trim();
  return normalized.length ? normalized : null;
};

const normalizeReps = (value?: string | number | null) => {
  const normalized = String(value ?? '').trim();
  if (!normalized) return '';

  const parts = normalized
    .split('-')
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((part) => Number.isFinite(part));

  if (parts.length === 2) {
    return String(Math.round((parts[0] + parts[1]) / 2));
  }

  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? String(parsed) : normalized;
};

const normalizeRir = (value?: string | number | null) => {
  const normalized = String(value ?? '').trim();
  if (!normalized) return '';
  const match = normalized.match(/\d+/);
  return match?.[0] ?? normalized;
};

const getWorkoutSetLabel = (set: WorkoutHistorySetDTO, index: number) => {
  const label = getTrimmedText(set.label);
  if (label) return label;
  if (index === 0) return 'Preparatória';
  return `Série ${index}`;
};

const formatWorkoutSetLine = (set: WorkoutHistorySetDTO) => {
  const weight = getTrimmedText(set.performedWeightLabel || set.plannedWeight) || 'Carga livre';
  const repsValue = set.performedReps > 0 ? String(set.performedReps) : normalizeReps(set.plannedReps) || '--';
  const rirValue = set.performedRir !== undefined && set.performedRir !== null
    ? String(set.performedRir)
    : normalizeRir(set.plannedRir);

  return rirValue
    ? `${weight} | ${repsValue} reps | ${rirValue} RIR`
    : `${weight} | ${repsValue} reps`;
};

function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <AppText
        style={{
          fontSize: 10,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 3,
          color: '#666666',
          marginBottom: 8,
        }}
      >
        {eyebrow}
      </AppText>
      <AppText style={{ fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 }}>
        {title}
      </AppText>
      <AppText style={{ fontSize: 13, lineHeight: 20, color: '#8A8A8F' }}>{subtitle}</AppText>
    </View>
  );
}

function SurfaceCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: Record<string, any>;
}) {
  return (
    <View
      style={{
        backgroundColor: '#0F0F10',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#1F1F23',
        padding: 18,
        ...style,
      }}
    >
      {children}
    </View>
  );
}

export function AssessmentsDashboardScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const drafts = useAssessmentsStore((state) => state.drafts);
  const [notifVisible, setNotifVisible] = useState(false);
  const [selectedWorkoutRecord, setSelectedWorkoutRecord] = useState<WorkoutSessionHistoryDTO | null>(null);
  const [selectedDietDay, setSelectedDietDay] = useState<DietAdherenceDay | null>(null);
  const [expandedWorkoutExercises, setExpandedWorkoutExercises] = useState<Record<string, boolean>>({});

  const { data: assessments = [], isLoading: isLoadingAssessments, refetch: refetchAssessments } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => getStudentEvaluations(session?.token!),
    enabled: !!session?.token,
  });
  const { data: workoutData, isLoading: isLoadingWorkout, refetch: refetchWorkout } = useQuery({
    queryKey: ['current-workout-dashboard'],
    queryFn: () => getCurrentWorkout(session?.token!),
    enabled: !!session?.token,
  });
  const { data: dietData, isLoading: isLoadingDiet, refetch: refetchDiet } = useQuery({
    queryKey: ['current-diet-dashboard'],
    queryFn: () => getCurrentDiet(session?.token!),
    enabled: !!session?.token,
  });
  const { data: adherenceData, isLoading: isLoadingAdherence, refetch: refetchAdherence } = useQuery({
    queryKey: ['diet-adherence-dashboard'],
    queryFn: () => getDietAdherence(session?.token!),
    enabled: !!session?.token,
  });

  useRefetchOnFocus(async () => {
    await Promise.all([
      refetchAssessments(),
      refetchWorkout(),
      refetchDiet(),
      refetchAdherence(),
    ]);
  }, Boolean(session?.token));

  const sortedAssessments = useMemo(
    () => [...assessments].sort((a, b) => STATUS_SORT[a.status] - STATUS_SORT[b.status]),
    [assessments],
  );

  const highlightedAssessment = useMemo(
    () => sortedAssessments.find((assessment) => assessment.status !== 'done') ?? null,
    [sortedAssessments],
  );

  const completedAssessments = useMemo(
    () => sortedAssessments.filter((assessment) => assessment.status === 'done' || !!assessment.result),
    [sortedAssessments],
  );

  const upcomingAssessments = useMemo(
    () =>
      sortedAssessments
        .filter((assessment) => assessment.status !== 'done')
        .slice(0, 4),
    [sortedAssessments],
  );

  const photoComparison = useMemo(() => {
    const evaluationsWithPhotos = assessments.filter((assessment) => assessment.photos?.length);
    if (evaluationsWithPhotos.length === 0) return null;

    const latest = evaluationsWithPhotos[0];
    const previous = evaluationsWithPhotos[1] ?? null;
    const latestPrimary = pickPreferredPhoto(latest);

    if (!latestPrimary) return null;

    if (previous) {
      const previousPrimary = pickPreferredPhoto(previous);

      return {
        items: [
          {
            label: 'Antes',
            assessment: previous,
            photo: previousPrimary,
            fallbackText: 'Sem foto anterior',
          },
          {
            label: 'Atual',
            assessment: latest,
            photo: latestPrimary,
            fallbackText: 'Sem foto atual',
          },
        ],
      };
    }

    const latestSecondary = pickPreferredPhoto(latest, [latestPrimary.url])
      || latest.photos?.find((photo) => photo?.url && photo.url !== latestPrimary.url)
      || latestPrimary;

    return {
      items: [
        {
          label: latestSecondary?.label || 'Registro complementar',
          assessment: latest,
          photo: latestSecondary,
          fallbackText: 'Sem foto complementar',
        },
        {
          label: latestPrimary?.label || 'Registro principal',
          assessment: latest,
          photo: latestPrimary,
          fallbackText: 'Sem foto principal',
        },
      ],
    };
  }, [assessments]);

  const workoutRecords = useMemo(() => {
    const historyBySession = workoutData?.historyBySession || {};
    return Object.values(historyBySession)
      .flat()
      .sort((left, right) => {
        const leftDate = new Date(left.recordedAt || 0).getTime();
        const rightDate = new Date(right.recordedAt || 0).getTime();
        return rightDate - leftDate;
      })
      .slice(0, 4);
  }, [workoutData]);

  const dietRecentDays = useMemo(
    () => [...(adherenceData?.days || [])].slice(-4).reverse(),
    [adherenceData?.days],
  );

  const isLoading = isLoadingAssessments || isLoadingWorkout || isLoadingDiet || isLoadingAdherence;
  const dietPlan = dietData?.diet ?? null;

  if (isLoading) {
    return (
      <View
        style={{ flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }}
      >
        <ActivityIndicator size="large" color="#A78BFA" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <PageHeader
          title="Avaliações"
          subtitle="Fotos, registros e próximos passos"
          onNotificationPress={() => setNotifVisible(true)}
        />

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 148, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(60).duration(450)}>
            <SectionTitle
              eyebrow="Em destaque"
              title="Sua próxima entrega"
              subtitle="A avaliação que precisa da sua atenção continua no topo, e o restante da jornada fica organizado logo abaixo."
            />
            {highlightedAssessment ? (
              <AssessmentCard
                assessment={highlightedAssessment as any}
                draft={drafts[highlightedAssessment.id] ?? createAssessmentDraft(highlightedAssessment as any)}
                onPress={() => router.push(`/(app)/assessments/${highlightedAssessment.id}` as Href)}
              />
            ) : (
              <SurfaceCard>
                <AppText style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 }}>
                  Nenhuma avaliação pendente
                </AppText>
                <AppText style={{ fontSize: 13, lineHeight: 20, color: '#8A8A8F' }}>
                  Quando uma nova avaliação for liberada, ela vai aparecer aqui em primeiro lugar.
                </AppText>
              </SurfaceCard>
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(110).duration(450)} style={{ marginTop: 28 }}>
            <SectionTitle
              eyebrow="Comparativo"
              title="Fotos das avaliações"
              subtitle="Confira lado a lado os registros corporais mais recentes para acompanhar a evolução visual."
            />
            <SurfaceCard>
              {photoComparison ? (
                <View style={{ gap: 14 }}>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {photoComparison.items.map(({ label, photo, assessment, fallbackText }, index) => {
                      return (
                        <Pressable
                          key={`${photo?.url || 'empty'}-${index}`}
                          disabled={!assessment}
                          onPress={() => {
                            if (!assessment) return;
                            router.push(`/(app)/assessments/${assessment.id}` as Href);
                          }}
                          style={{ flex: 1 }}
                        >
                          <View
                            style={{
                              borderRadius: 22,
                              overflow: 'hidden',
                              borderWidth: 1,
                              borderColor: assessment ? '#242429' : '#1B1B1F',
                              backgroundColor: '#161619',
                              opacity: assessment ? 1 : 0.78,
                            }}
                          >
                            {photo ? (
                              <Image
                                source={{ uri: photo.url }}
                                style={{ width: '100%', aspectRatio: 0.8, backgroundColor: '#111111' }}
                                resizeMode="cover"
                              />
                            ) : (
                              <View
                                style={{
                                  width: '100%',
                                  aspectRatio: 0.8,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: '#141417',
                                }}
                              >
                                <AppText style={{ fontSize: 12, color: '#666666' }}>{fallbackText}</AppText>
                              </View>
                            )}
                            <View style={{ padding: 12 }}>
                              <AppText style={{ fontSize: 10, color: '#7C7C84', textTransform: 'uppercase', letterSpacing: 2 }}>
                                {label}
                              </AppText>
                              <AppText style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginTop: 4 }}>
                                {assessment?.title || 'Aguardando comparação'}
                              </AppText>
                              <AppText style={{ fontSize: 12, color: '#8A8A8F', marginTop: 2 }}>
                                {assessment ? formatDateLabel(assessment.due_date) : fallbackText}
                              </AppText>
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <AppText style={{ fontSize: 13, lineHeight: 20, color: '#8A8A8F' }}>
                  Assim que suas avaliações concluídas tiverem fotos, o comparativo vai aparecer aqui.
                </AppText>
              )}
            </SurfaceCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160).duration(450)} style={{ marginTop: 28 }}>
            <SectionTitle
              eyebrow="Treino"
              title="Registros de treino"
              subtitle="As últimas execuções ficam reunidas aqui para você revisar volume, tempo e observações."
            />
            <SurfaceCard>
              {workoutRecords.length ? (
                <View style={{ gap: 12 }}>
                  {workoutRecords.map((record) => (
                    <Pressable
                      key={record.id}
                      onPress={() => {
                        setExpandedWorkoutExercises({})
                        setSelectedWorkoutRecord(record)
                      }}
                      style={{
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: '#232328',
                        backgroundColor: '#151518',
                        padding: 14,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                        <View style={{ flex: 1 }}>
                          <AppText style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>
                            {record.sessionDay || record.sessionName}
                          </AppText>
                          <AppText style={{ fontSize: 12, color: '#8A8A8F', marginTop: 4 }}>
                            {formatDateTimeLabel(record.recordedAt)}
                          </AppText>
                        </View>
                        <View
                          style={{
                            borderRadius: 999,
                            backgroundColor: 'rgba(139,92,246,0.14)',
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            alignSelf: 'flex-start',
                          }}
                        >
                          <AppText style={{ fontSize: 11, fontWeight: '700', color: '#C4B5FD' }}>
                            {record.validSets} séries
                          </AppText>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                        {[
                          `${record.totalReps} reps`,
                          `${record.volumeKg.toLocaleString('pt-BR')} kg`,
                          `${record.durationMinutes} min`,
                        ].map((item) => (
                          <View
                            key={item}
                            style={{
                              borderRadius: 999,
                              backgroundColor: '#101013',
                              borderWidth: 1,
                              borderColor: '#222228',
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                            }}
                          >
                          <AppText style={{ fontSize: 11, color: '#B8B8BE' }}>{item}</AppText>
                        </View>
                      ))}
                    </View>

                      <AppText style={{ fontSize: 12, fontWeight: '700', color: '#C4B5FD', marginTop: 12 }}>
                        Ver cargas, repetições e RIR
                      </AppText>

                      {record.observation ? (
                        <AppText style={{ fontSize: 12, lineHeight: 18, color: '#8A8A8F', marginTop: 12 }}>
                          {record.observation}
                        </AppText>
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              ) : (
                <AppText style={{ fontSize: 13, lineHeight: 20, color: '#8A8A8F' }}>
                  Seus registros de treino vão aparecer aqui assim que você concluir sessões no app.
                </AppText>
              )}
            </SurfaceCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(210).duration(450)} style={{ marginTop: 28 }}>
            <SectionTitle
              eyebrow="Dieta"
              title="Registros da dieta"
              subtitle="Consulte os últimos dias com água, refeições registradas e macros consumidos."
            />
            <SurfaceCard>
              {dietRecentDays.length ? (
                <View style={{ gap: 10 }}>
                  {dietRecentDays.map((day) => (
                    <Pressable
                      key={day.date}
                      onPress={() => setSelectedDietDay(day)}
                      style={{
                        borderRadius: 18,
                        borderWidth: 1,
                        borderColor: '#232328',
                        backgroundColor: '#151518',
                        padding: 14,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <View style={{ flex: 1 }}>
                          <AppText style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
                            {formatDateLabel(day.date)}
                          </AppText>
                          <AppText style={{ fontSize: 12, color: '#8A8A8F', marginTop: 4 }}>
                            Água {Number(day.waterMl / 1000).toFixed(1).replace('.', ',')}L • Refeições {day.totalMealsLogged}/{day.totalMealsPlanned}
                          </AppText>
                        </View>
                        <View
                          style={{
                            borderRadius: 999,
                            backgroundColor: 'rgba(34,197,94,0.14)',
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                          }}
                        >
                          <AppText style={{ fontSize: 11, fontWeight: '700', color: '#86EFAC' }}>
                            {Math.round(day.adherencePercent)}%
                          </AppText>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                        {[
                          `${day.consumedCalories} kcal`,
                          `${day.consumedProtein}g prot`,
                          `${day.consumedCarbs}g carb`,
                          `${day.consumedFat}g gord`,
                        ].map((item) => (
                          <View
                            key={item}
                            style={{
                              borderRadius: 999,
                              backgroundColor: '#101013',
                              borderWidth: 1,
                              borderColor: '#222228',
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                            }}
                          >
                            <AppText style={{ fontSize: 11, color: '#B8B8BE' }}>{item}</AppText>
                          </View>
                        ))}
                      </View>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <AppText style={{ fontSize: 13, lineHeight: 20, color: '#8A8A8F' }}>
                  Seus registros alimentares vão aparecer aqui assim que houver consumo lançado nos últimos dias.
                </AppText>
              )}
            </SurfaceCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(260).duration(450)} style={{ marginTop: 28 }}>
            <SectionTitle
              eyebrow="Histórico"
              title="Avaliações anteriores"
              subtitle="Revise as avaliações concluídas, suas datas e o material enviado em cada etapa."
            />
            <SurfaceCard>
              {completedAssessments.length ? (
                <View style={{ gap: 12 }}>
                  {completedAssessments.slice(0, 4).map((assessment) => {
                    const tone = getStatusTone(assessment.status);
                    return (
                      <Pressable
                        key={assessment.id}
                        onPress={() => router.push(`/(app)/assessments/${assessment.id}` as Href)}
                        style={{
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: '#232328',
                          backgroundColor: '#151518',
                          padding: 14,
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                          <View style={{ flex: 1 }}>
                            <AppText style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>
                              {assessment.title}
                            </AppText>
                            <AppText style={{ fontSize: 12, color: '#8A8A8F', marginTop: 4 }}>
                              {formatDateLabel(assessment.due_date)} · {assessment.category}
                            </AppText>
                          </View>
                          <View
                            style={{
                              borderRadius: 999,
                              backgroundColor: tone.backgroundColor,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              alignSelf: 'flex-start',
                            }}
                          >
                            <AppText style={{ fontSize: 11, fontWeight: '700', color: tone.color }}>
                              {formatAssessmentStatus(assessment.status)}
                            </AppText>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                          <AppText style={{ fontSize: 11, color: '#B8B8BE' }}>
                            {assessment.photos?.length || 0} foto(s)
                          </AppText>
                          <AppText style={{ fontSize: 11, color: '#B8B8BE' }}>
                            {assessment.exams?.length || 0} anexo(s)
                          </AppText>
                          {assessment.result?.nextAssessmentAt ? (
                            <AppText style={{ fontSize: 11, color: '#B8B8BE' }}>
                              Próxima: {formatDateLabel(assessment.result.nextAssessmentAt)}
                            </AppText>
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <AppText style={{ fontSize: 13, lineHeight: 20, color: '#8A8A8F' }}>
                  Ainda não existe nenhuma avaliação concluída no seu histórico.
                </AppText>
              )}
            </SurfaceCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(310).duration(450)} style={{ marginTop: 28 }}>
            <SectionTitle
              eyebrow="Próximas"
              title="Próximas avaliações"
              subtitle="Veja o que já foi agendado ou ainda está em andamento para não perder a sequência."
            />
            <SurfaceCard>
              {upcomingAssessments.length ? (
                <View style={{ gap: 12 }}>
                  {upcomingAssessments.map((assessment) => {
                    const tone = getStatusTone(assessment.status);
                    return (
                      <Pressable
                        key={assessment.id}
                        onPress={() => router.push(`/(app)/assessments/${assessment.id}` as Href)}
                        style={{
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: '#232328',
                          backgroundColor: '#151518',
                          padding: 14,
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                          <View style={{ flex: 1 }}>
                            <AppText style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>
                              {assessment.title}
                            </AppText>
                            <AppText style={{ fontSize: 12, color: '#8A8A8F', marginTop: 4 }}>
                              {assessment.plan || 'Sem plano'} · {formatDateLabel(assessment.due_date)}
                            </AppText>
                          </View>
                          <View
                            style={{
                              borderRadius: 999,
                              backgroundColor: tone.backgroundColor,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              alignSelf: 'flex-start',
                            }}
                          >
                            <AppText style={{ fontSize: 11, fontWeight: '700', color: tone.color }}>
                              {formatAssessmentStatus(assessment.status)}
                            </AppText>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <AppText style={{ fontSize: 13, lineHeight: 20, color: '#8A8A8F' }}>
                  Não há novas avaliações previstas no momento.
                </AppText>
              )}
            </SurfaceCard>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={Boolean(selectedWorkoutRecord)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSelectedWorkoutRecord(null);
          setExpandedWorkoutExercises({});
        }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', padding: 24, justifyContent: 'center' }}>
          <Pressable
            style={{ position: 'absolute', inset: 0 }}
            onPress={() => {
              setSelectedWorkoutRecord(null);
              setExpandedWorkoutExercises({});
            }}
          />
          <View
            style={{
              maxHeight: '82%',
              borderRadius: 28,
              backgroundColor: '#0F0F10',
              borderWidth: 1,
              borderColor: '#1F1F23',
              padding: 18,
            }}
          >
            <AppText style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 3, color: '#666666', marginBottom: 8 }}>
              Registro de treino
            </AppText>
            <AppText style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF' }}>
              {selectedWorkoutRecord?.sessionDay || selectedWorkoutRecord?.sessionName}
            </AppText>
            <AppText style={{ fontSize: 12, color: '#8A8A8F', marginTop: 4, marginBottom: 16 }}>
              {formatDateTimeLabel(selectedWorkoutRecord?.recordedAt)}
            </AppText>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    `${selectedWorkoutRecord?.validSets || 0} séries válidas`,
                    `${selectedWorkoutRecord?.totalReps || 0} reps`,
                    formatKgLabel(selectedWorkoutRecord?.volumeKg || 0),
                    `${selectedWorkoutRecord?.durationMinutes || 0} min`,
                  ].map((item) => (
                    <View
                      key={item}
                      style={{
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: '#26262B',
                        backgroundColor: '#141416',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                      }}
                    >
                      <AppText style={{ fontSize: 11, color: '#B8B8BE' }}>{item}</AppText>
                    </View>
                  ))}
                </View>

                {selectedWorkoutRecord?.observation ? (
                  <View
                    style={{
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: '#232328',
                      backgroundColor: '#151518',
                      padding: 14,
                    }}
                  >
                    <AppText style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: '#666666', marginBottom: 6 }}>
                      Observação do registro
                    </AppText>
                    <AppText style={{ fontSize: 13, lineHeight: 20, color: '#B8B8BE' }}>
                      {selectedWorkoutRecord.observation}
                    </AppText>
                  </View>
                ) : null}

                {(selectedWorkoutRecord?.exercises || []).map((exercise) => {
                  const expanded = Boolean(expandedWorkoutExercises[exercise.exerciseId]);

                  return (
                    <Pressable
                      key={exercise.exerciseId}
                      onPress={() =>
                        setExpandedWorkoutExercises((current) => ({
                          ...current,
                          [exercise.exerciseId]: !current[exercise.exerciseId],
                        }))
                      }
                      style={{
                        borderRadius: 18,
                        borderWidth: 1,
                        borderColor: expanded ? '#8B5CF6' : '#232328',
                        backgroundColor: '#151518',
                        padding: 14,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <View style={{ flex: 1 }}>
                          <AppText style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>
                            {exercise.exerciseName}
                          </AppText>
                          <AppText style={{ fontSize: 12, color: '#8A8A8F', marginTop: 4 }}>
                            {exercise.completedSets}/{exercise.plannedSets} séries concluídas • {formatKgLabel(exercise.totalVolumeKg)} • {exercise.totalReps} reps
                          </AppText>
                        </View>
                        {expanded ? <CaretDown color="#C4B5FD" size={18} weight="bold" /> : <CaretRight color="#C4B5FD" size={18} weight="bold" />}
                      </View>

                      {expanded ? (
                        <View style={{ gap: 8, marginTop: 12 }}>
                          {exercise.sets.map((set, index) => (
                            <View
                              key={set.setId}
                              style={{
                                borderRadius: 14,
                                backgroundColor: '#101013',
                                borderWidth: 1,
                                borderColor: '#222228',
                                paddingHorizontal: 12,
                                paddingVertical: 11,
                              }}
                            >
                              <AppText style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                                {getWorkoutSetLabel(set, index)}
                              </AppText>
                              <AppText style={{ fontSize: 12, color: '#B8B8BE', marginTop: 4 }}>
                                {formatWorkoutSetLine(set)}
                              </AppText>
                            </View>
                          ))}
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <Pressable
              onPress={() => {
                setSelectedWorkoutRecord(null);
                setExpandedWorkoutExercises({});
              }}
              style={{
                marginTop: 16,
                borderRadius: 999,
                backgroundColor: '#8B5CF6',
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <AppText style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Fechar</AppText>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(selectedDietDay)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDietDay(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', padding: 24, justifyContent: 'center' }}>
          <Pressable style={{ position: 'absolute', inset: 0 }} onPress={() => setSelectedDietDay(null)} />
          <View
            style={{
              maxHeight: '86%',
              borderRadius: 28,
              backgroundColor: '#0F0F10',
              borderWidth: 1,
              borderColor: '#1F1F23',
              padding: 18,
            }}
          >
            <AppText style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 3, color: '#666666', marginBottom: 8 }}>
              Registro alimentar
            </AppText>
            <AppText style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF' }}>
              {selectedDietDay ? formatDateLabel(selectedDietDay.date) : 'Dia'}
            </AppText>
            <AppText style={{ fontSize: 12, color: '#8A8A8F', marginTop: 4 }}>
              {dietPlan?.name || 'Dieta atual'}{dietPlan?.professional ? ` • ${dietPlan.professional}` : ''}
            </AppText>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 16 }}>
              <View style={{ gap: 12 }}>
                <View
                  style={{
                    borderRadius: 22,
                    borderWidth: 1,
                    borderColor: '#232328',
                    backgroundColor: '#151518',
                    padding: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
                    <View style={{ flex: 1 }}>
                      <AppText style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: '#666666' }}>
                        Resumo do dia
                      </AppText>
                      <AppText style={{ fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginTop: 8 }}>
                        {selectedDietDay?.consumedCalories || 0}
                      </AppText>
                      <AppText style={{ fontSize: 12, color: '#8A8A8F', marginTop: 4 }}>
                        kcal consumidas
                      </AppText>
                    </View>
                    <View
                      style={{
                        borderRadius: 999,
                        backgroundColor: 'rgba(34,197,94,0.16)',
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                      }}
                    >
                      <AppText style={{ fontSize: 12, fontWeight: '700', color: '#86EFAC' }}>
                        {Math.round(selectedDietDay?.adherencePercent || 0)}% aderência
                      </AppText>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
                    {[
                      { icon: Drop, label: 'Água', value: `${Number((selectedDietDay?.waterMl || 0) / 1000).toFixed(1).replace('.', ',')}L`, accent: '#7DD3FC' },
                      { icon: ForkKnife, label: 'Refeições', value: `${selectedDietDay?.totalMealsLogged || 0}/${selectedDietDay?.totalMealsPlanned || 0}`, accent: '#C4B5FD' },
                      { icon: CheckCircle, label: 'Proteínas', value: formatShortMacro(selectedDietDay?.consumedProtein || 0), accent: '#86EFAC' },
                      { icon: CheckCircle, label: 'Carbo', value: formatShortMacro(selectedDietDay?.consumedCarbs || 0), accent: '#FDE68A' },
                      { icon: CheckCircle, label: 'Gorduras', value: formatShortMacro(selectedDietDay?.consumedFat || 0), accent: '#F9A8D4' },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <View
                          key={item.label}
                          style={{
                            minWidth: '30%',
                            flexGrow: 1,
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: '#222228',
                            backgroundColor: '#101013',
                            paddingHorizontal: 12,
                            paddingVertical: 11,
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Icon color={item.accent} size={14} weight="duotone" />
                            <AppText style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.6, color: '#7C7C84' }}>
                              {item.label}
                            </AppText>
                          </View>
                          <AppText style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginTop: 8 }}>
                            {item.value}
                          </AppText>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {dietPlan?.meals?.length ? (
                  dietPlan.meals.map((meal) => {
                    const mealLog = getMealLog(selectedDietDay?.dayLog, meal.id);
                    const status = getMealStatus(meal, mealLog);
                    const statusMeta = MEAL_STATUS_META[status];
                    const consumed = getMealConsumedMacros(mealLog);

                    return (
                      <View
                        key={meal.id}
                        style={{
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: '#232328',
                          backgroundColor: '#151518',
                          padding: 14,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                          <View style={{ flex: 1 }}>
                            <AppText style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>
                              {meal.name}
                            </AppText>
                            <AppText style={{ fontSize: 12, color: '#8A8A8F', marginTop: 4 }}>
                              {meal.time} • {meal.context}
                            </AppText>
                          </View>
                          <View
                            style={{
                              borderRadius: 999,
                              backgroundColor: statusMeta.background,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                            }}
                          >
                            <AppText style={{ fontSize: 10, fontWeight: '700', color: statusMeta.accent, textTransform: 'uppercase', letterSpacing: 1.4 }}>
                              {statusMeta.label}
                            </AppText>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                          {[
                            `${Math.round(consumed.calories)} kcal`,
                            `${formatShortMacro(consumed.protein)} prot`,
                            `${formatShortMacro(consumed.carbs)} carb`,
                            `${formatShortMacro(consumed.fat)} gord`,
                          ].map((item) => (
                            <View
                              key={item}
                              style={{
                                borderRadius: 999,
                                borderWidth: 1,
                                borderColor: '#222228',
                                backgroundColor: '#101013',
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                              }}
                            >
                              <AppText style={{ fontSize: 11, color: '#B8B8BE' }}>{item}</AppText>
                            </View>
                          ))}
                        </View>

                        <View style={{ gap: 8, marginTop: 14 }}>
                          {meal.foods.map((food: DietFood) => {
                            const loggedFood = mealLog?.foodLogs.find((item) => item.foodId === food.id);
                            const completed = Boolean(loggedFood);

                            return (
                              <View
                                key={food.id}
                                style={{
                                  borderRadius: 16,
                                  borderWidth: 1,
                                  borderColor: '#222228',
                                  backgroundColor: '#101013',
                                  paddingHorizontal: 12,
                                  paddingVertical: 12,
                                }}
                              >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                                  <View style={{ flex: 1 }}>
                                    <AppText style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                                      {loggedFood?.selectedFoodName || food.name}
                                    </AppText>
                                    <AppText style={{ fontSize: 11, color: '#8A8A8F', marginTop: 4 }}>
                                      Planejado {food.displayQuantity} • Atual {loggedFood ? `${Math.round(loggedFood.actualGrams)}g` : 'não registrado'}
                                    </AppText>
                                  </View>
                                  <View
                                    style={{
                                      borderRadius: 999,
                                      backgroundColor: completed ? 'rgba(34,197,94,0.16)' : 'rgba(255,255,255,0.06)',
                                      paddingHorizontal: 10,
                                      paddingVertical: 6,
                                      alignSelf: 'flex-start',
                                    }}
                                  >
                                    <AppText style={{ fontSize: 10, fontWeight: '700', color: completed ? '#86EFAC' : '#A1A1AA', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                                      {completed ? 'Feita' : 'Pendente'}
                                    </AppText>
                                  </View>
                                </View>

                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                                  {[
                                    `${Math.round(loggedFood?.nutrition.calories || food.nutrition.calories)} kcal`,
                                    `${formatShortMacro(loggedFood?.nutrition.protein || food.nutrition.protein)} prot`,
                                    `${formatShortMacro(loggedFood?.nutrition.carbs || food.nutrition.carbs)} carb`,
                                    `${formatShortMacro(loggedFood?.nutrition.fat || food.nutrition.fat)} gord`,
                                  ].map((item) => (
                                    <View
                                      key={item}
                                      style={{
                                        borderRadius: 999,
                                        backgroundColor: '#151518',
                                        paddingHorizontal: 9,
                                        paddingVertical: 5,
                                      }}
                                    >
                                      <AppText style={{ fontSize: 10, color: '#B8B8BE' }}>{item}</AppText>
                                    </View>
                                  ))}
                                </View>
                              </View>
                            );
                          })}
                        </View>

                        {mealLog?.observation ? (
                          <View
                            style={{
                              borderRadius: 16,
                              borderWidth: 1,
                              borderColor: '#222228',
                              backgroundColor: '#101013',
                              padding: 12,
                              marginTop: 12,
                            }}
                          >
                            <AppText style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, color: '#666666', marginBottom: 6 }}>
                              Observação
                            </AppText>
                            <AppText style={{ fontSize: 12, lineHeight: 18, color: '#B8B8BE' }}>
                              {mealLog.observation}
                            </AppText>
                          </View>
                        ) : null}

                        {mealLog?.photoUrl ? (
                          <Image
                            source={{ uri: mealLog.photoUrl }}
                            style={{
                              width: '100%',
                              height: 168,
                              borderRadius: 16,
                              marginTop: 12,
                              backgroundColor: '#101013',
                            }}
                            resizeMode="cover"
                          />
                        ) : null}
                      </View>
                    );
                  })
                ) : (
                  <View
                    style={{
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: '#232328',
                      backgroundColor: '#151518',
                      padding: 16,
                    }}
                  >
                    <AppText style={{ fontSize: 13, lineHeight: 20, color: '#8A8A8F' }}>
                      O plano da dieta ainda não está disponível para montar a visão detalhada deste dia.
                    </AppText>
                  </View>
                )}
              </View>
            </ScrollView>

            <Pressable
              onPress={() => setSelectedDietDay(null)}
              style={{
                marginTop: 16,
                borderRadius: 999,
                backgroundColor: '#8B5CF6',
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <AppText style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Fechar</AppText>
            </Pressable>
          </View>
        </View>
      </Modal>

      <NotificationsModal visible={notifVisible} onClose={() => setNotifVisible(false)} />
    </View>
  );
}
