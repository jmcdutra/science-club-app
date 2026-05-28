import { useMemo } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Barbell,
  CalendarBlank,
  Crown,
  Fire,
  ForkKnife,
  Medal,
  ShieldCheck,
  Timer,
  Trophy,
  ClipboardText,
} from 'phosphor-react-native';

import { AppText } from '@/src/shared/components/ui/AppText';
import { AppCard } from '@/src/shared/components/ui/AppCard';
import { useAuthStore } from '@/src/features/auth/services/auth.store';
import { colors } from '@/src/shared/theme/tokens';

import { getRankingsOverview, type RankingBoardDTO, type RankingMetric } from '../api/rankings';

const LEVELS = [
  { level: 1, color: '#9CA3AF', Icon: ShieldCheck },
  { level: 2, color: '#22C55E', Icon: ShieldCheck },
  { level: 3, color: '#38BDF8', Icon: Barbell },
  { level: 4, color: '#A78BFA', Icon: Fire },
  { level: 5, color: '#F59E0B', Icon: Crown },
];

const METRIC_META: Record<RankingMetric, { label: string; Icon: typeof Barbell }> = {
  workouts_completed: { label: 'Treinos', Icon: Barbell },
  total_weight: { label: 'Carga', Icon: Trophy },
  training_minutes: { label: 'Tempo', Icon: Timer },
  consulting_days: { label: 'Consultoria', Icon: CalendarBlank },
  meals_logged: { label: 'Dieta', Icon: ForkKnife },
};

function getBoardMetrics(board: Pick<RankingBoardDTO, 'metric' | 'metrics'>) {
  return board.metrics?.length ? board.metrics : [board.metric];
}

function getBoardMetricSummary(board: Pick<RankingBoardDTO, 'metric' | 'metrics'>) {
  const metrics = getBoardMetrics(board);
  if (metrics.length === 1) return METRIC_META[metrics[0]]?.label || 'Métrica';
  return metrics.map((metric) => METRIC_META[metric]?.label || metric).join(' + ');
}

function formatValue(value: number, unit: string) {
  if (unit === 'kg' && value >= 1000) return `${(value / 1000).toFixed(1).replace('.', ',')} t`;
  if (unit === 'min' && value >= 60) return `${(value / 60).toFixed(1).replace('.', ',')} h`;
  return `${Math.round(value)} ${unit}`;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getLevelVisual(level: number) {
  return LEVELS.find((item) => item.level === level) ?? LEVELS[0];
}

function DetailRow({
  entry,
  unit,
  isMe,
}: {
  entry: RankingBoardDTO['entries'][number];
  unit: string;
  isMe: boolean;
}) {
  const visual = getLevelVisual(entry.level.level);
  const medalColor = entry.position === 1 ? '#F59E0B' : entry.position === 2 ? '#CBD5E1' : entry.position === 3 ? '#B7794B' : colors.text.muted;

  return (
    <View
      className="mb-2 flex-row items-center gap-3 rounded-2xl border px-4 py-3.5"
      style={{
        borderColor: isMe ? 'rgba(139,92,246,0.55)' : colors.border.subtle,
        backgroundColor: isMe ? 'rgba(139,92,246,0.11)' : colors.bg.surface,
      }}
    >
      <View className="w-8 items-center">
        {entry.position <= 3 ? (
          <Medal size={20} color={medalColor} weight="fill" />
        ) : (
          <AppText className="text-[13px] font-bold text-text-muted">{entry.position}</AppText>
        )}
      </View>

      <View className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: `${visual.color}18` }}>
        <AppText className="text-[12px] font-bold text-text-main">{getInitials(entry.name)}</AppText>
      </View>

      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-2">
          <AppText className="text-[14px] font-semibold text-text-main" numberOfLines={1}>
            {entry.name}
          </AppText>
          {isMe ? (
            <View className="rounded-full bg-brand-primary/15 px-2 py-0.5">
              <AppText className="text-[9px] font-bold text-brand-secondary">VOCÊ</AppText>
            </View>
          ) : null}
        </View>
        <View className="mt-1 flex-row items-center gap-1.5">
          <visual.Icon size={12} color={visual.color} weight="duotone" />
          <AppText className="text-[11px] text-text-muted">
            Nível {entry.level.level} · {entry.level.title}
          </AppText>
        </View>
      </View>

      <AppText className="text-right text-[14px] font-bold text-text-main">
        {formatValue(entry.value, unit)}
      </AppText>
    </View>
  );
}

export function RankingDetailScreen() {
  const router = useRouter();
  const { rankingId } = useLocalSearchParams<{ rankingId: string }>();
  const authSession = useAuthStore((state) => state.session);

  const rankingsQuery = useQuery({
    queryKey: ['rankings-overview'],
    queryFn: () => getRankingsOverview(authSession!.token),
    enabled: Boolean(authSession?.token),
  });

  const board = useMemo(() => {
    const allBoards = [
      ...(rankingsQuery.data?.publicRankings ?? []),
      ...(rankingsQuery.data?.customRankings ?? []),
    ];
    return allBoards.find((item) => item.id === rankingId);
  }, [rankingId, rankingsQuery.data]);

  if (rankingsQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-base">
        <ActivityIndicator color={colors.brand.primary} size="large" />
      </View>
    );
  }

  if (!board) {
    return (
      <SafeAreaView className="flex-1 bg-bg-base px-6 pt-5">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          className="mb-8 h-11 w-11 items-center justify-center rounded-xl border border-border-subtle bg-bg-surface"
        >
          <ArrowLeft color={colors.text.main} size={20} weight="bold" />
        </Pressable>
        <AppCard className="items-center gap-3 py-8">
          <Trophy size={30} color={colors.brand.secondary} weight="duotone" />
          <AppText className="text-center text-[16px] font-bold text-text-main">
            Ranking não encontrado
          </AppText>
          <AppText className="text-center text-[13px] leading-5 text-text-muted">
            Atualize a lista ou abra outro ranking.
          </AppText>
        </AppCard>
      </SafeAreaView>
    );
  }

  const metrics = getBoardMetrics(board);
  const meta = METRIC_META[metrics[0]];
  const MetricIcon = meta.Icon;
  const viewerEntry = board.entries.find((entry) => entry.studentId === authSession?.studentId);
  const inviteCode = board.inviteCode || '';

  return (
    <View className="flex-1 bg-bg-base">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="border-b border-border-subtle px-6 pb-4 pt-4">
          <View className="mb-5 flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              onPress={() => router.back()}
              className="h-11 w-11 items-center justify-center rounded-xl border border-border-subtle bg-bg-surface"
            >
              <ArrowLeft color={colors.text.main} size={20} weight="bold" />
            </Pressable>
            <View className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
              <AppText className="text-[9px] font-bold text-emerald-400">ATIVO</AppText>
            </View>
          </View>

          <View className="flex-row items-start gap-4">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/15">
              <MetricIcon size={28} color={colors.brand.secondary} weight="duotone" />
            </View>
            <View className="flex-1">
              <AppText className="text-[23px] font-heading font-semibold text-text-main" numberOfLines={2}>
                {board.title}
              </AppText>
              <AppText className="mt-1 text-[12px] leading-5 text-text-muted">
                {getBoardMetricSummary(board)} · {board.entries.length} participantes
              </AppText>
            </View>
          </View>

          {inviteCode ? (
            <Pressable
              onPress={() => Alert.alert('Código do grupo', inviteCode)}
              className="mt-4 flex-row items-center justify-between rounded-2xl border border-brand-primary/25 bg-brand-primary/10 px-4 py-3"
            >
              <View>
                <AppText className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                  Código do grupo
                </AppText>
                <AppText className="mt-1 text-[16px] font-bold tracking-[0.14em] text-brand-secondary">
                  {inviteCode}
                </AppText>
              </View>
              <ClipboardText size={18} color={colors.brand.secondary} weight="bold" />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-6 pb-12 pt-5"
        >
          {viewerEntry ? (
            <View className="mb-5 rounded-[20px] border border-brand-primary/25 bg-brand-primary/10 p-4">
              <AppText className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                Sua posição
              </AppText>
              <View className="mt-3 flex-row items-end justify-between gap-4">
                <View>
                  <AppText className="text-[24px] font-heading font-semibold text-text-main">
                    {viewerEntry.position}º lugar
                  </AppText>
                  <AppText className="mt-1 text-[12px] text-text-muted">
                    Nível {viewerEntry.level.level} · {viewerEntry.level.title}
                  </AppText>
                </View>
                <AppText className="text-[18px] font-bold text-brand-secondary">
                  {formatValue(viewerEntry.value, board.unit)}
                </AppText>
              </View>
            </View>
          ) : null}

          <AppText className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
            Classificação completa
          </AppText>
          {board.entries.map((entry) => (
            <DetailRow
              key={entry.studentId}
              entry={entry}
              unit={board.unit}
              isMe={entry.studentId === authSession?.studentId}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
