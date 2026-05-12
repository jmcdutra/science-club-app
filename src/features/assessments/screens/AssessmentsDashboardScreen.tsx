import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Polyline, Stop } from 'react-native-svg';

import { AppText } from '@/src/shared/components/ui/AppText';
import { NotificationsModal } from '@/src/shared/components/ui/NotificationsModal';
import { useAuthStore } from '@/src/features/auth/services/auth.store';
import { PageHeader } from '@/src/shared/components/layout/PageHeader';

import { AssessmentCard } from '../components/AssessmentCard';
import { createAssessmentDraft, useAssessmentsStore } from '../services/assessments.store';
import { getStudentEvaluations } from '../api/assessments';
import { Assessment, AssessmentStatus } from '../types';

/* ─── Status sort order ──────────────────────────────────────────────────── */

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

/* ─── Evolution Card ─────────────────────────────────────────────────────── */

type EvolutionData = {
  peso?: number;
  pesoDelta?: number;
  deltaDate?: string;
  imc?: number;
  imcDelta?: number;
  gordura?: number;
  gorduraDelta?: number;
  massa?: number;
  massaDelta?: number;
};

type DeltaInfo = { text: string; good: boolean } | null;

function makeDelta(v: number | undefined, suffix: string, lowerIsBetter: boolean): DeltaInfo {
  if (v == null) return null;
  const good = lowerIsBetter ? v < 0 : v > 0;
  return { text: `${v > 0 ? '+' : ''}${v.toFixed(1)}${suffix}`, good };
}

function EvolutionCard({ data }: { data: EvolutionData }) {
  const fmt = (v?: number) => (v != null ? v.toFixed(1) : '—');

  const pesoDeltaInfo: DeltaInfo =
    data.pesoDelta != null
      ? { text: `−${Math.abs(data.pesoDelta).toFixed(1)}kg`, good: data.pesoDelta < 0 }
      : null;

  return (
    <View
      style={{
        backgroundColor: '#111111',
        borderWidth: 1,
        borderColor: '#222222',
        borderRadius: 24,
        padding: 18,
        marginBottom: 24,
        overflow: 'hidden',
      }}
    >
      {/* Purple glow blob */}
      <View
        style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 160,
          height: 160,
          borderRadius: 80,
          backgroundColor: 'rgba(139,92,246,0.08)',
        }}
      />

      <View style={{ position: 'relative' }}>
        {/* Eyebrow */}
        <AppText
          style={{
            fontSize: 10,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 3.5,
            color: '#555555',
            marginBottom: 8,
          }}
        >
          Evolução atual
        </AppText>

        {/* Main metric: peso */}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <AppText
              style={{
                fontSize: 36,
                fontWeight: '700',
                letterSpacing: -1,
                lineHeight: 40,
                color: '#FFFFFF',
              }}
            >
              {fmt(data.peso)}
            </AppText>
            {data.peso != null && (
              <AppText style={{ fontSize: 14, fontWeight: '500', color: '#8B5CF6' }}>
                kg
              </AppText>
            )}
          </View>

          {pesoDeltaInfo && (
            <View
              style={{
                backgroundColor: pesoDeltaInfo.good
                  ? 'rgba(34,197,94,0.12)'
                  : 'rgba(251,113,133,0.12)',
                borderRadius: 99,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <AppText
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: pesoDeltaInfo.good ? '#22C55E' : '#FB7185',
                }}
              >
                {pesoDeltaInfo.text}
              </AppText>
            </View>
          )}
        </View>

        <AppText style={{ fontSize: 11, color: '#555555', marginBottom: 14 }}>
          {data.deltaDate
            ? `vs. última avaliação · ${data.deltaDate}`
            : 'vs. última avaliação'}
        </AppText>

        {/* Sparkline */}
        <Svg width="100%" height={42} viewBox="0 0 280 42">
          <Defs>
            <LinearGradient id="spkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.2" />
              <Stop offset="100%" stopColor="#8B5CF6" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Polyline
            fill="none"
            stroke="url(#spkGrad)"
            strokeWidth="2"
            points="0,38 40,34 80,36 120,28 160,22 200,16 240,18 280,8"
          />
          <Circle cx={280} cy={8} r={4} fill="#8B5CF6" />
          <Circle cx={280} cy={8} r={7} fill="rgba(139,92,246,0.2)" />
        </Svg>

        {/* Mini stats row */}
        <View style={{ flexDirection: 'row', gap: 20, marginTop: 10 }}>
          {(
            [
              {
                lbl: 'IMC',
                val: fmt(data.imc),
                delta: makeDelta(
                  data.imcDelta != null ? -Math.abs(data.imcDelta) : undefined,
                  '',
                  true,
                ),
              },
              {
                lbl: '% Gordura',
                val: data.gordura != null ? `${fmt(data.gordura)}%` : '—',
                delta: makeDelta(
                  data.gorduraDelta != null ? -Math.abs(data.gorduraDelta) : undefined,
                  '%',
                  true,
                ),
              },
              {
                lbl: 'Massa Magra',
                val: data.massa != null ? `${fmt(data.massa)}kg` : '—',
                delta: makeDelta(data.massaDelta, '', false),
              },
            ] as { lbl: string; val: string; delta: DeltaInfo }[]
          ).map((s) => (
            <View key={s.lbl}>
              <AppText
                style={{
                  fontSize: 10,
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  color: '#555555',
                  marginBottom: 2,
                }}
              >
                {s.lbl}
              </AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <AppText style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                  {s.val}
                </AppText>
                {s.delta && (
                  <AppText
                    style={{
                      fontSize: 10,
                      fontWeight: '700',
                      color: s.delta.good ? '#22C55E' : '#FB7185',
                    }}
                  >
                    {s.delta.text}
                  </AppText>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/* ─── Screen ─────────────────────────────────────────────────────────────── */

export function AssessmentsDashboardScreen() {
  const { session } = useAuthStore();
  const drafts = useAssessmentsStore((state) => state.drafts);
  const [notifVisible, setNotifVisible] = useState(false);

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => getStudentEvaluations(session?.token!),
    enabled: !!session?.token,
  });

  const sortedAssessments = useMemo(
    () => [...assessments].sort((a, b) => STATUS_SORT[a.status] - STATUS_SORT[b.status]),
    [assessments],
  );

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
          subtitle="Acompanhe sua evolução"
          onNotificationPress={() => setNotifVisible(true)}
        />

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 148, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Evolution hero card ── */}
          <Animated.View entering={FadeInDown.delay(80).duration(500)}>
            <EvolutionCard data={{}} />
          </Animated.View>

          {/* ── Section label ── */}
          <Animated.View entering={FadeInDown.delay(160).duration(500)}>
            <AppText
              style={{
                fontSize: 11,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: 3.5,
                color: '#555555',
                marginBottom: 12,
              }}
            >
              Avaliações
            </AppText>
          </Animated.View>

          {/* ── All assessments ── */}
          <Animated.View entering={FadeInDown.delay(220).duration(500)}>
            <View style={{ gap: 8 }}>
              {sortedAssessments.map((assessment) => (
                <AssessmentCard
                  key={assessment.id}
                  assessment={assessment as any}
                  draft={drafts[assessment.id] ?? createAssessmentDraft(assessment as any)}
                  onPress={() => router.push(`/(app)/assessments/${assessment.id}` as Href)}
                />
              ))}
              {sortedAssessments.length === 0 && (
                <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                  <AppText style={{ fontSize: 14, color: '#444444', textAlign: 'center' }}>
                    Nenhuma avaliação encontrada.
                  </AppText>
                </View>
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      <NotificationsModal visible={notifVisible} onClose={() => setNotifVisible(false)} />
    </View>
  );
}
