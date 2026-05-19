import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Href, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Barbell,
  CalendarBlank,
  CaretDown,
  CaretLeft,
  CaretRight,
  CheckCircle,
  Crown,
  Fire,
  ForkKnife,
  Medal,
  Plus,
  ShieldCheck,
  Timer,
  Trophy,
  User,
  UsersThree,
  X,
} from 'phosphor-react-native';

import { AppButton } from '@/src/shared/components/ui/AppButton';
import { AppCard } from '@/src/shared/components/ui/AppCard';
import { AppInput } from '@/src/shared/components/ui/AppInput';
import { AppText } from '@/src/shared/components/ui/AppText';
import { ScreenHeader } from '@/src/shared/components/layout/ScreenHeader';
import { useAuthStore } from '@/src/features/auth/services/auth.store';
import { colors } from '@/src/shared/theme/tokens';

import {
  createRankingBoard,
  getRankingsOverview,
  searchRankingStudents,
  type CreateRankingPayload,
  type RankingBoardDTO,
  type RankingMetric,
  type RankingStudentDTO,
} from '../api/rankings';

const LEVELS = [
  { level: 1, title: 'Iniciante', min: 0, color: '#9CA3AF', Icon: ShieldCheck },
  { level: 2, title: 'Constante', min: 900, color: '#22C55E', Icon: CheckCircle },
  { level: 3, title: 'Forte', min: 2200, color: '#38BDF8', Icon: Barbell },
  { level: 4, title: 'Atleta', min: 4400, color: '#A78BFA', Icon: Fire },
  { level: 5, title: 'Elite', min: 7600, color: '#F59E0B', Icon: Crown },
];

const METRIC_OPTIONS: {
  key: RankingMetric;
  label: string;
  description: string;
  Icon: typeof Barbell;
}[] = [
  {
    key: 'workouts_completed',
    label: 'Treinos',
    description: 'Sessões concluídas no período',
    Icon: Barbell,
  },
  {
    key: 'total_weight',
    label: 'Carga',
    description: 'Volume total levantado',
    Icon: Trophy,
  },
  {
    key: 'training_minutes',
    label: 'Tempo',
    description: 'Minutos treinando',
    Icon: Timer,
  },
  {
    key: 'consulting_days',
    label: 'Consultoria',
    description: 'Dias como aluno',
    Icon: CalendarBlank,
  },
  {
    key: 'meals_logged',
    label: 'Dieta',
    description: 'Refeições registradas',
    Icon: ForkKnife,
  },
];

const PERIOD_OPTIONS: { key: CreateRankingPayload['period']; label: string }[] = [
  { key: 'current_month', label: 'Este mês' },
  { key: 'all_time', label: 'Sempre' },
  { key: 'custom', label: 'Período' },
];

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

function getLevelIcon(level: number) {
  return LEVELS.find((item) => item.level === level)?.Icon ?? ShieldCheck;
}

function getLevelColor(level: number) {
  return LEVELS.find((item) => item.level === level)?.color ?? colors.brand.secondary;
}

function getMetricOption(metric: RankingMetric) {
  return METRIC_OPTIONS.find((item) => item.key === metric) ?? METRIC_OPTIONS[0];
}

function Segment<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="flex-row rounded-2xl border border-border-subtle bg-bg-surface p-1">
      {options.map((option) => {
        const active = value === option.key;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            className="flex-1 items-center justify-center rounded-xl px-3 py-3"
            style={{ backgroundColor: active ? colors.bg.elevated : 'transparent' }}
          >
            <AppText className={active ? 'text-[12px] font-bold text-text-main' : 'text-[12px] font-semibold text-text-muted'}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function MetricFilter({
  activeMetric,
  onChange,
}: {
  activeMetric: RankingMetric;
  onChange: (metric: RankingMetric) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingRight: 24 }}
      style={{ marginHorizontal: -24, paddingLeft: 24, marginBottom: 16 }}
    >
      {METRIC_OPTIONS.map(({ key, label, Icon }) => {
        const active = activeMetric === key;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            className="flex-row items-center gap-2 rounded-full border px-4 py-2.5"
            style={{
              borderColor: active ? 'rgba(139,92,246,0.70)' : colors.border.subtle,
              backgroundColor: active ? 'rgba(139,92,246,0.13)' : colors.bg.surface,
            }}
          >
            <Icon size={15} color={active ? colors.brand.secondary : colors.text.muted} weight="duotone" />
            <AppText className={active ? 'text-[12px] font-bold text-brand-secondary' : 'text-[12px] font-semibold text-text-muted'}>
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function LevelPanel({
  level,
}: {
  level?: { level: number; title: string; xp: number; progress: number; nextLevelXp: number | null };
}) {
  const Icon = getLevelIcon(level?.level ?? 1);
  const levelColor = getLevelColor(level?.level ?? 1);
  const nextLabel = level?.nextLevelXp ? `${Math.max(0, level.nextLevelXp - level.xp)} XP para o próximo nível` : 'Nível máximo alcançado';

  return (
    <View className="mb-5 rounded-[22px] border border-border-subtle bg-bg-surface p-5">
      <View className="flex-row items-start gap-4">
        <View
          className="h-14 w-14 items-center justify-center rounded-2xl border"
          style={{ borderColor: `${levelColor}55`, backgroundColor: `${levelColor}18` }}
        >
          <Icon size={27} color={levelColor} weight="duotone" />
        </View>
        <View className="flex-1">
          <AppText className="text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
            Seu nível
          </AppText>
          <AppText className="mt-1 text-[21px] font-heading font-semibold text-text-main">
            Nível {level?.level ?? 1} · {level?.title ?? 'Iniciante'}
          </AppText>
          <View className="mt-4 h-2 overflow-hidden rounded-full bg-bg-base">
            <View
              className="h-full rounded-full"
              style={{ width: `${level?.progress ?? 0}%`, backgroundColor: levelColor }}
            />
          </View>
          <View className="mt-2 flex-row items-center justify-between gap-3">
            <AppText className="text-[11px] font-semibold text-text-main">
              {level?.xp ?? 0} XP
            </AppText>
            <AppText className="flex-1 text-right text-[11px] text-text-muted" numberOfLines={1}>
              {nextLabel}
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );
}

function RankingRow({
  entry,
  unit,
  isMe,
}: {
  entry: RankingBoardDTO['entries'][number];
  unit: string;
  isMe: boolean;
}) {
  const levelColor = getLevelColor(entry.level.level);
  const LevelIcon = getLevelIcon(entry.level.level);
  const medalColor = entry.position === 1 ? '#F59E0B' : entry.position === 2 ? '#CBD5E1' : entry.position === 3 ? '#B7794B' : colors.text.muted;
  const MedalIcon = entry.position <= 3 ? Medal : null;

  return (
    <View
      className="mb-2 flex-row items-center gap-3 rounded-2xl border px-3.5 py-3"
      style={{
        borderColor: isMe ? 'rgba(139,92,246,0.50)' : colors.border.subtle,
        backgroundColor: isMe ? 'rgba(139,92,246,0.10)' : colors.bg.surface,
      }}
    >
      <View className="w-8 items-center">
        {MedalIcon ? (
          <MedalIcon size={20} color={medalColor} weight="fill" />
        ) : (
          <AppText className="text-[13px] font-bold text-text-muted">{entry.position}</AppText>
        )}
      </View>

      <View
        className="h-10 w-10 items-center justify-center rounded-full border"
        style={{ borderColor: `${levelColor}44`, backgroundColor: `${levelColor}18` }}
      >
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
          <LevelIcon size={12} color={levelColor} weight="duotone" />
          <AppText className="text-[11px] font-semibold text-text-muted" numberOfLines={1}>
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

function GlobalLeaderboard({
  board,
  viewerId,
}: {
  board?: RankingBoardDTO;
  viewerId?: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const entries = board?.entries ?? [];
  const visibleEntries = showAll ? entries : entries.slice(0, 5);
  const viewerEntry = entries.find((entry) => entry.studentId === viewerId);

  if (!board) {
    return (
      <AppCard className="items-center gap-3 py-8">
        <Trophy size={28} color={colors.brand.secondary} weight="duotone" />
        <AppText className="text-center text-[15px] font-semibold text-text-main">
          Ranking indisponível
        </AppText>
        <AppText className="text-center text-[13px] leading-5 text-text-muted">
          Ainda não há dados suficientes para esta métrica.
        </AppText>
      </AppCard>
    );
  }

  return (
    <View>
      <View className="mb-3">
        <AppText className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
          {board.description}
        </AppText>
      </View>

      {viewerEntry && viewerEntry.position > 5 ? (
        <View className="mb-3 flex-row items-center gap-3 rounded-2xl border border-brand-primary/25 bg-brand-primary/10 px-4 py-3">
          <User size={16} color={colors.brand.secondary} weight="duotone" />
          <AppText className="flex-1 text-[13px] font-bold text-brand-secondary">
            Você está em {viewerEntry.position}º lugar
          </AppText>
          <AppText className="text-[12px] font-semibold text-text-muted">
            {formatValue(viewerEntry.value, board.unit)}
          </AppText>
        </View>
      ) : null}

      {visibleEntries.map((entry) => (
        <RankingRow
          key={entry.studentId}
          entry={entry}
          unit={board.unit}
          isMe={entry.studentId === viewerId}
        />
      ))}

      {!showAll && entries.length > 5 ? (
        <Pressable
          onPress={() => setShowAll(true)}
          className="mt-1 min-h-[46px] flex-row items-center justify-center gap-2 rounded-2xl border border-border-subtle bg-bg-surface px-4"
        >
          <AppText className="text-[13px] font-semibold text-text-muted">
            Ver todos os {entries.length} alunos
          </AppText>
          <CaretDown size={14} color={colors.text.muted} weight="bold" />
        </Pressable>
      ) : null}
    </View>
  );
}

function MyRankingCard({
  board,
  viewerId,
  onPress,
}: {
  board: RankingBoardDTO;
  viewerId?: string;
  onPress: () => void;
}) {
  const option = getMetricOption(board.metric);
  const viewerEntry = board.entries.find((entry) => entry.studentId === viewerId);

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-[20px] border border-border-subtle bg-bg-surface p-4"
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.985 : 1 }] }]}
    >
      <View className="mb-4 flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <AppText className="text-[17px] font-heading font-semibold text-text-main" numberOfLines={1}>
            {board.title}
          </AppText>
          <AppText className="mt-1 text-[11px] text-text-muted" numberOfLines={1}>
            {option.label} · {board.entries.length} participantes
          </AppText>
        </View>
        <View className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
          <AppText className="text-[9px] font-bold text-emerald-400">ATIVO</AppText>
        </View>
      </View>

      <View className="flex-row gap-2">
        {board.entries.slice(0, 3).map((entry) => (
          <View key={entry.studentId} className="flex-1 rounded-2xl bg-bg-base px-2 py-3">
            <View className="mb-2 items-center">
              <Medal size={18} color={entry.position === 1 ? '#F59E0B' : entry.position === 2 ? '#CBD5E1' : '#B7794B'} weight="fill" />
            </View>
            <AppText className={entry.studentId === viewerId ? 'text-center text-[11px] font-bold text-brand-secondary' : 'text-center text-[11px] font-bold text-text-main'} numberOfLines={1}>
              {entry.name.split(' ')[0]}
            </AppText>
            <AppText className="mt-1 text-center text-[10px] text-text-muted" numberOfLines={1}>
              {formatValue(entry.value, board.unit)}
            </AppText>
          </View>
        ))}
      </View>

      {viewerEntry && viewerEntry.position > 3 ? (
        <View className="mt-3 flex-row items-center gap-2 rounded-2xl bg-brand-primary/10 px-3 py-2">
          <User size={13} color={colors.brand.secondary} weight="bold" />
          <AppText className="flex-1 text-[11px] font-semibold text-brand-secondary">
            Sua posição: {viewerEntry.position}º
          </AppText>
          <AppText className="text-[11px] text-text-muted">
            {formatValue(viewerEntry.value, board.unit)}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

function LevelGuide() {
  return (
    <View className="mt-5 rounded-[20px] border border-border-subtle bg-bg-surface p-4">
      <AppText className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
        Sistema de níveis
      </AppText>
      {LEVELS.map(({ level, title, min, color, Icon }, index) => (
        <View
          key={level}
          className="flex-row items-center gap-3 py-3"
          style={{ borderBottomWidth: index < LEVELS.length - 1 ? 1 : 0, borderBottomColor: colors.border.subtle }}
        >
          <View className="h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}16` }}>
            <Icon size={17} color={color} weight="duotone" />
          </View>
          <View className="flex-1">
            <AppText style={{ color }} className="text-[13px] font-bold">
              {title}
            </AppText>
            <AppText className="mt-0.5 text-[11px] text-text-muted">
              Nível {level}
            </AppText>
          </View>
          <AppText className="text-[11px] font-semibold text-text-muted">
            {min.toLocaleString('pt-BR')}+ XP
          </AppText>
        </View>
      ))}
    </View>
  );
}

function RankingSkeleton() {
  return (
    <View className="gap-4">
      {[0, 1, 2].map((item) => (
        <AppCard key={item} className="gap-4">
          <View className="h-5 w-2/3 rounded-full bg-bg-elevated" />
          <View className="h-16 rounded-2xl bg-bg-base" />
          <View className="gap-3">
            <View className="h-4 w-full rounded-full bg-bg-elevated" />
            <View className="h-4 w-5/6 rounded-full bg-bg-elevated" />
            <View className="h-4 w-4/6 rounded-full bg-bg-elevated" />
          </View>
        </AppCard>
      ))}
    </View>
  );
}

function CreateRankingModal({
  visible,
  onClose,
  token,
}: {
  visible: boolean;
  onClose: () => void;
  token: string;
}) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [metric, setMetric] = useState<RankingMetric>('workouts_completed');
  const [period, setPeriod] = useState<CreateRankingPayload['period']>('current_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<RankingStudentDTO[]>([]);

  const selectedMetric = getMetricOption(metric);
  const studentsQuery = useQuery({
    queryKey: ['ranking-students', search],
    queryFn: () => searchRankingStudents(token, search),
    enabled: visible,
  });

  const createMutation = useMutation({
    mutationFn: () => createRankingBoard(token, {
      title,
      metric,
      period,
      startDate: period === 'custom' ? startDate : undefined,
      endDate: period === 'custom' ? endDate : undefined,
      participantIds: selected.map((item) => item.id),
      visibility: 'private',
      description: selectedMetric.description,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['rankings-overview'] });
      setTitle('');
      setSelected([]);
      setStep(1);
      onClose();
    },
  });

  const toggleStudent = (student: RankingStudentDTO) => {
    setSelected((current) => (
      current.some((item) => item.id === student.id)
        ? current.filter((item) => item.id !== student.id)
        : [...current, student]
    ));
  };

  const handlePrimary = () => {
    if (step < 3) {
      setStep((current) => current + 1);
      return;
    }
    createMutation.mutate();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-bg-base" edges={['top', 'bottom']}>
        <View className="flex-row items-center justify-between border-b border-border-subtle px-6 py-4">
          <View>
            <AppText className="text-[12px] text-text-muted">Etapa {step} de 3</AppText>
            <AppText className="text-[20px] font-heading font-semibold text-text-main">
              Criar ranking
            </AppText>
          </View>
          <AppButton size="icon" variant="secondary" onPress={onClose}>
            <X size={19} color={colors.text.main} />
          </AppButton>
        </View>

        <FlatList
          keyboardShouldPersistTaps="handled"
          data={step === 3 ? (studentsQuery.data ?? []) : []}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-4 px-6 pb-10 pt-5"
          ListHeaderComponent={(
            <View className="gap-5">
              <View className="flex-row gap-1">
                {[1, 2, 3].map((item) => (
                  <View
                    key={item}
                    className="h-1 flex-1 rounded-full"
                    style={{ backgroundColor: item <= step ? colors.brand.primary : colors.bg.elevated }}
                  />
                ))}
              </View>

              {step === 1 ? (
                <>
                  <AppInput label="Nome do ranking" value={title} onChangeText={setTitle} placeholder="Quem treina mais em junho" />
                  <View className="gap-2">
                    <AppText className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                      Período
                    </AppText>
                    <Segment options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
                  </View>
                  {period === 'custom' ? (
                    <View className="flex-row gap-3">
                      <View className="flex-1">
                        <AppInput label="Início" value={startDate} onChangeText={setStartDate} placeholder="2026-06-01" />
                      </View>
                      <View className="flex-1">
                        <AppInput label="Fim" value={endDate} onChangeText={setEndDate} placeholder="2026-06-30" />
                      </View>
                    </View>
                  ) : null}
                </>
              ) : null}

              {step === 2 ? (
                <View className="gap-2">
                  <AppText className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                    Métrica do ranking
                  </AppText>
                  {METRIC_OPTIONS.map(({ key, label, description, Icon }) => {
                    const active = metric === key;
                    return (
                      <Pressable
                        key={key}
                        onPress={() => setMetric(key)}
                        className="flex-row items-center gap-3 rounded-2xl border px-4 py-3.5"
                        style={{
                          borderColor: active ? colors.brand.primary : colors.border.subtle,
                          backgroundColor: active ? 'rgba(139,92,246,0.12)' : colors.bg.surface,
                        }}
                      >
                        <View className="h-9 w-9 items-center justify-center rounded-xl bg-bg-base">
                          <Icon size={18} color={active ? colors.brand.secondary : colors.text.muted} weight="duotone" />
                        </View>
                        <View className="flex-1">
                          <AppText className={active ? 'text-[14px] font-bold text-brand-secondary' : 'text-[14px] font-bold text-text-main'}>
                            {label}
                          </AppText>
                          <AppText className="mt-0.5 text-[11px] text-text-muted">
                            {description}
                          </AppText>
                        </View>
                        {active ? <CheckCircle size={17} color={colors.brand.secondary} weight="fill" /> : null}
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              {step === 3 ? (
                <View className="gap-2">
                  <AppText className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                    Participantes
                  </AppText>
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Buscar aluno"
                    placeholderTextColor={colors.text.muted}
                    className="h-14 rounded-2xl border border-border-subtle bg-bg-surface px-4 text-text-main"
                  />
                  <View className="rounded-2xl border border-brand-primary/25 bg-brand-primary/10 p-4">
                    <AppText className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                      Resumo
                    </AppText>
                    <AppText className="mt-2 text-[14px] font-bold text-text-main">
                      {title || 'Ranking sem nome'}
                    </AppText>
                    <AppText className="mt-1 text-[12px] text-text-muted">
                      {selectedMetric.label} · você + {selected.length} participantes
                    </AppText>
                  </View>
                </View>
              ) : null}
            </View>
          )}
          renderItem={({ item }) => {
            const active = selected.some((student) => student.id === item.id);
            return (
              <Pressable
                onPress={() => toggleStudent(item)}
                className="flex-row items-center justify-between rounded-2xl border px-4 py-4"
                style={{
                  borderColor: active ? colors.brand.primary : colors.border.subtle,
                  backgroundColor: active ? 'rgba(139,92,246,0.14)' : colors.bg.surface,
                }}
              >
                <AppText className="text-[14px] font-semibold text-text-main">{item.name}</AppText>
                <AppText className={active ? 'text-[12px] font-bold text-brand-secondary' : 'text-[12px] text-text-muted'}>
                  {active ? 'Selecionado' : 'Adicionar'}
                </AppText>
              </Pressable>
            );
          }}
          ListFooterComponent={(
            <View className="mt-2 flex-row gap-2">
              {step > 1 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setStep((current) => Math.max(1, current - 1))}
                  className="h-[52px] w-[52px] items-center justify-center rounded-[14px] border border-border-subtle bg-bg-surface"
                >
                  <CaretLeft size={18} color={colors.text.main} weight="bold" />
                </Pressable>
              ) : null}
              <View className="flex-1">
                <Pressable
                  accessibilityRole="button"
                  disabled={(step === 1 && !title.trim()) || createMutation.isPending}
                  onPress={handlePrimary}
                  className="h-[52px] flex-row items-center justify-center gap-2 rounded-[14px] border border-transparent px-4"
                  style={{
                    backgroundColor: (step === 1 && !title.trim()) || createMutation.isPending
                      ? '#1A1A1A'
                      : colors.brand.primary,
                    opacity: (step === 1 && !title.trim()) || createMutation.isPending ? 0.55 : 1,
                  }}
                >
                  {createMutation.isPending ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <AppText className="text-[15px] font-bold text-white">
                        {step === 3 ? 'Criar ranking' : 'Próximo'}
                      </AppText>
                      {step === 3 ? (
                        <Trophy size={18} color="#FFFFFF" weight="bold" />
                      ) : (
                        <CaretRight size={18} color="#FFFFFF" weight="bold" />
                      )}
                    </>
                  )}
                </Pressable>
                {createMutation.isError ? (
                  <AppText className="mt-3 text-center text-[12px] text-red-400">
                    Não foi possível criar o ranking.
                  </AppText>
                ) : null}
              </View>
            </View>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

export function RankingsScreen() {
  const router = useRouter();
  const authSession = useAuthStore((state) => state.session);
  const [createOpen, setCreateOpen] = useState(false);
  const [tab, setTab] = useState<'global' | 'mine'>('global');
  const [activeMetric, setActiveMetric] = useState<RankingMetric>('workouts_completed');

  const rankingsQuery = useQuery({
    queryKey: ['rankings-overview'],
    queryFn: () => getRankingsOverview(authSession!.token),
    enabled: Boolean(authSession?.token),
  });

  const publicBoards = useMemo(() => rankingsQuery.data?.publicRankings ?? [], [rankingsQuery.data?.publicRankings]);
  const customBoards = useMemo(() => rankingsQuery.data?.customRankings ?? [], [rankingsQuery.data?.customRankings]);
  const activeBoard = useMemo(
    () => publicBoards.find((board) => board.metric === activeMetric) ?? publicBoards[0],
    [activeMetric, publicBoards],
  );

  return (
    <View className="flex-1 bg-bg-base">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ScreenHeader
          title="Ranking"
          subtitle="Níveis, desafios e consistência"
          rightAction={(
            <AppButton size="icon" onPress={() => setCreateOpen(true)}>
              <Plus size={20} color="#FFFFFF" weight="bold" />
            </AppButton>
          )}
        />

        <FlatList
          data={tab === 'mine' ? customBoards : []}
          keyExtractor={(item) => item.id}
          refreshControl={(
            <RefreshControl
              refreshing={rankingsQuery.isRefetching}
              onRefresh={() => rankingsQuery.refetch()}
              tintColor={colors.brand.primary}
            />
          )}
          contentContainerClassName="px-6 pb-36 pt-5"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={(
            <View>
              <Segment
                options={[
                  { key: 'global', label: 'Global' },
                  { key: 'mine', label: `Meus rankings${customBoards.length ? ` (${customBoards.length})` : ''}` },
                ]}
                value={tab}
                onChange={setTab}
              />

              {rankingsQuery.isLoading ? (
                <View className="mt-5">
                  <RankingSkeleton />
                </View>
              ) : tab === 'global' ? (
                <View className="mt-5">
                  <LevelPanel level={rankingsQuery.data?.viewerLevel} />
                  <MetricFilter activeMetric={activeMetric} onChange={setActiveMetric} />
                  <GlobalLeaderboard board={activeBoard} viewerId={authSession?.studentId} />
                  <LevelGuide />
                </View>
              ) : (
                <View className="mt-5">
                  <View className="mb-4 flex-row items-center gap-4 rounded-[20px] border border-brand-primary/25 bg-brand-primary/10 p-4">
                    <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/15">
                      <UsersThree size={25} color={colors.brand.secondary} weight="duotone" />
                    </View>
                    <View className="flex-1">
                      <AppText className="text-[15px] font-bold text-text-main">
                        Crie um ranking personalizado
                      </AppText>
                      <AppText className="mt-1 text-[12px] leading-5 text-text-muted">
                        Compare seu desempenho com amigos e conhecidos.
                      </AppText>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setCreateOpen(true)}
                      className="h-10 shrink-0 flex-row items-center justify-center gap-1.5 rounded-xl bg-brand-primary px-3.5"
                      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
                    >
                      <Plus size={14} color="#FFFFFF" weight="bold" />
                      <AppText className="text-[13px] font-bold text-white">Criar</AppText>
                    </Pressable>
                  </View>
                  {customBoards.length ? (
                    <AppText className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                      Meus rankings
                    </AppText>
                  ) : null}
                </View>
              )}
            </View>
          )}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 45).duration(320)}>
              <MyRankingCard
                board={item}
                viewerId={authSession?.studentId}
                onPress={() => router.push(`/(app)/rankings/${item.id}` as Href)}
              />
            </Animated.View>
          )}
          ListEmptyComponent={!rankingsQuery.isLoading && tab === 'mine' ? (
            <AppCard className="items-center gap-3 py-8">
              <UsersThree size={30} color={colors.brand.secondary} weight="duotone" />
              <AppText className="text-center text-[15px] font-semibold text-text-main">
                Nenhum ranking criado ainda
              </AppText>
              <AppText className="text-center text-[13px] leading-5 text-text-muted">
                Crie um desafio com amigos para acompanhar uma métrica específica.
              </AppText>
            </AppCard>
          ) : null}
          ListFooterComponent={rankingsQuery.isError ? (
            <AppCard className="mt-4 border-red-500/20 bg-red-500/10">
              <AppText className="text-[13px] font-medium text-red-300">
                Não foi possível carregar os rankings.
              </AppText>
            </AppCard>
          ) : null}
        />
      </SafeAreaView>

      {authSession?.token ? (
        <CreateRankingModal visible={createOpen} onClose={() => setCreateOpen(false)} token={authSession.token} />
      ) : null}
    </View>
  );
}
