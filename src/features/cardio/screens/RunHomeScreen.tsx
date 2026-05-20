import {
  CalendarBlank,
  Clock,
  Fire,
  FlagCheckered,
  Play,
  Trophy,
  TrendUp,
} from 'phosphor-react-native';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppCard } from '@/src/shared/components/ui/AppCard';
import { AppText } from '@/src/shared/components/ui/AppText';
import { useAuthStore } from '@/src/features/auth/services/auth.store';

import { getCardioActivities, getCardioSummary } from '../api/cardio';
import { CardioIcon } from '../components/CardioIcon';
import { RoutePreview } from '../components/RoutePreview';
import { CARDIO_TYPES, type CardioActivityDTO, type CardioTypeConfig } from '../types';

function fmtDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}m`;
  return `${m}min`;
}

function getCurrentWeekLabel() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '');
  return `${fmt(monday)} - ${fmt(sunday)}`;
}

function getActivityDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (diff === 0) return `Hoje, ${time}`;
  if (diff === 1) return `Ontem, ${time}`;
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function ActivityRow({ item }: { item: CardioActivityDTO }) {
  const type = CARDIO_TYPES.find(t => t.id === item.type) ?? CARDIO_TYPES[0];

  return (
    <AppCard className="mb-2 flex-row items-center gap-3 px-4 py-3">
      <View
        className="h-11 w-11 items-center justify-center rounded-[14px]"
        style={{ backgroundColor: `rgba(${type.rgb}, 0.13)` }}
      >
        <CardioIcon name={type.icon} size={21} color={type.color} weight="bold" />
      </View>

      <View className="min-w-0 flex-1 gap-0.5">
        <AppText className="text-[13px] font-bold text-text-main">{type.label}</AppText>
        <AppText className="text-[10px] text-text-muted">
          {getActivityDateLabel(item.started_at)}
        </AppText>
      </View>

      <View className="flex-row items-center gap-3">
        {item.distance_km > 0 ? (
          <MetricPill value={item.distance_km.toFixed(1)} label="km" color={type.color} />
        ) : null}
        <MetricPill value={fmtDuration(item.elapsed_seconds)} label="tempo" />
        <MetricPill value={String(item.calories)} label="kcal" color="#F59E0B" />
      </View>
    </AppCard>
  );
}

function MetricPill({ value, label, color = '#F8FAFC' }: { value: string; label: string; color?: string }) {
  return (
    <View className="items-center">
      <AppText className="text-[14px] font-bold" style={{ color }}>
        {value}
      </AppText>
      <AppText className="text-[9px] font-semibold uppercase tracking-[0.06em] text-text-muted">
        {label}
      </AppText>
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <AppText className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
      {children}
    </AppText>
  );
}

export function RunHomeScreen() {
  const { session: authSession } = useAuthStore();
  const token = authSession?.token;
  const [selectedType, setSelectedType] = useState<CardioTypeConfig>(CARDIO_TYPES[0]);

  const { data: summary } = useQuery({
    queryKey: ['cardio-summary'],
    queryFn: () => getCardioSummary(token!),
    enabled: !!token,
  });

  const { data: activitiesData } = useQuery({
    queryKey: ['cardio-activities'],
    queryFn: () => getCardioActivities(token!, { limit: 10 }),
    enabled: !!token,
  });

  const activities = activitiesData?.activities ?? [];
  const weekKm = summary?.week.km ?? 0;
  const weekSeconds = summary?.week.seconds ?? 0;
  const weekKcal = summary?.week.kcal ?? 0;
  const weekCount = summary?.week.count ?? 0;
  const goalKm = summary?.goal_km ?? 30;
  const progressPct = Math.min(100, goalKm > 0 ? (weekKm / goalKm) * 100 : 0);
  const prs = summary?.prs;

  const handleStart = useCallback(() => {
    router.push(`/(app)/run/active?type=${selectedType.id}` as any);
  }, [selectedType.id]);

  const prItems = useMemo(() => {
    const items: { label: string; val: string; date: string }[] = [];
    if (prs?.bestPace) items.push(prs.bestPace);
    if (prs?.longestDistance) items.push(prs.longestDistance);
    if (prs?.streak) items.push(prs.streak);
    return items;
  }, [prs]);

  const renderActivity = useCallback(
    ({ item }: { item: CardioActivityDTO }) => <ActivityRow item={item} />,
    [],
  );

  const listHeader = useMemo(
    () => (
      <View>
        <View className="mb-4 flex-row items-center justify-between pt-1">
          <View>
            <AppText className="font-heading text-[24px] font-bold text-text-main">
              Run
            </AppText>
            <AppText className="mt-0.5 text-[12px] text-text-muted">
              Cardio • {getCurrentWeekLabel()}
            </AppText>
          </View>
          <View className="h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-bg-surface">
            <CalendarBlank size={16} color="#A1A1AA" weight="bold" />
          </View>
        </View>

        <AppCard className="mb-4 overflow-hidden p-4">
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              right: -70,
              top: -70,
              width: 180,
              height: 180,
              borderRadius: 999,
              backgroundColor: `rgba(${selectedType.rgb}, 0.12)`,
            }}
          />
          <View className="relative">
            <View className="mb-3 flex-row items-center justify-between">
              <SectionLabel>Esta semana</SectionLabel>
              <View className="flex-row items-center gap-1.5 rounded-full bg-bg-elevated px-2.5 py-1">
                <FlagCheckered size={11} color={selectedType.color} weight="bold" />
                <AppText className="text-[10px] font-bold" style={{ color: selectedType.color }}>
                  {weekCount} treinos
                </AppText>
              </View>
            </View>

            <View className="mb-3 flex-row overflow-hidden rounded-2xl border border-border-subtle">
              {[
                { lbl: 'Distância', val: `${weekKm.toFixed(1)} km`, icon: TrendUp, color: selectedType.color },
                { lbl: 'Tempo', val: fmtDuration(weekSeconds), icon: Clock, color: '#38BDF8' },
                { lbl: 'Calorias', val: `${weekKcal}`, icon: Fire, color: '#F59E0B' },
              ].map((s, index) => {
                const Icon = s.icon;
                return (
                  <View
                    key={s.lbl}
                    className="flex-1 items-center bg-bg-elevated px-2 py-3"
                    style={{
                      borderRightWidth: index < 2 ? 1 : 0,
                      borderRightColor: 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <Icon size={15} color={s.color} weight="bold" />
                    <AppText className="mt-1 text-[15px] font-bold" style={{ color: s.color }}>
                      {s.val}
                    </AppText>
                    <AppText className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-text-muted">
                      {s.lbl}
                    </AppText>
                  </View>
                );
              })}
            </View>

            <View className="mb-1.5 flex-row items-center justify-between">
              <AppText className="text-[10px] text-text-muted">Meta semanal</AppText>
              <AppText className="text-[10px] text-text-muted">
                {weekKm.toFixed(1)} / {goalKm} km
              </AppText>
            </View>
            <View className="h-1.5 overflow-hidden rounded-full bg-bg-elevated">
              <View
                className="h-full rounded-full"
                style={{ width: `${Math.max(0, progressPct)}%`, backgroundColor: selectedType.color }}
              />
            </View>
          </View>
        </AppCard>

        <SectionLabel>Tipo de atividade</SectionLabel>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 9, paddingBottom: 2, paddingHorizontal: 22 }}
          style={{ marginBottom: 16, marginHorizontal: -22 }}
        >
          {CARDIO_TYPES.map(type => {
            const isSelected = selectedType.id === type.id;
            return (
              <Pressable
                key={type.id}
                onPress={() => setSelectedType(type)}
                style={({ pressed }) => ({
                  minWidth: 88,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: isSelected ? type.color : 'rgba(255,255,255,0.08)',
                  backgroundColor: isSelected ? `rgba(${type.rgb}, 0.13)` : '#111111',
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  opacity: pressed ? 0.78 : 1,
                })}
              >
                <View className="items-center">
                  <View className="mb-2 h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: `rgba(${type.rgb}, 0.14)` }}>
                    <CardioIcon name={type.icon} size={19} color={isSelected ? type.color : '#A1A1AA'} weight="bold" />
                  </View>
                </View>
                <AppText className="text-center text-[11px] font-bold" style={{ color: isSelected ? type.color : '#A1A1AA' }}>
                  {type.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          onPress={handleStart}
          style={({ pressed }) => ({
            marginBottom: 20,
            borderRadius: 24,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: `rgba(${selectedType.rgb}, 0.22)`,
            backgroundColor: '#101014',
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <RoutePreview color={selectedType.color} rgb={selectedType.rgb} compact />
          <View className="flex-row items-center gap-3 px-4 py-4">
            <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: selectedType.color }}>
              <Play size={18} color="#FFFFFF" weight="fill" />
            </View>
            <View className="min-w-0 flex-1">
              <AppText className="font-heading text-[18px] font-bold text-text-main">
                Iniciar {selectedType.label}
              </AppText>
              <AppText className="mt-0.5 text-[11px] text-text-muted">
                GPS, ritmo e calorias em tempo real
              </AppText>
            </View>
            <CardioIcon name={selectedType.icon} size={25} color={selectedType.color} weight="bold" />
          </View>
        </Pressable>

        {prItems.length > 0 ? (
          <View className="mb-5">
            <SectionLabel>Recordes pessoais</SectionLabel>
            <View className="flex-row flex-wrap gap-2">
              {prItems.map((pr, index) => (
                <AppCard key={`${pr.label}-${index}`} className="gap-1 px-3 py-3" style={{ minWidth: '47%', flexGrow: 1 }}>
                  <View className="mb-1 flex-row items-center gap-1.5">
                    <Trophy size={12} color="#FBBF24" weight="fill" />
                    <AppText className="text-[9px] font-bold uppercase tracking-[0.06em] text-[#FBBF24]">
                      PR
                    </AppText>
                  </View>
                  <AppText className="text-[16px] font-bold text-text-main">{pr.val}</AppText>
                  <AppText className="text-[10px] text-text-muted">{pr.label}</AppText>
                  {pr.date ? (
                    <AppText className="text-[9px] text-text-muted opacity-60">{pr.date}</AppText>
                  ) : null}
                </AppCard>
              ))}
            </View>
          </View>
        ) : null}

        {activities.length > 0 ? <SectionLabel>Atividades recentes</SectionLabel> : null}
      </View>
    ),
    [
      activities.length,
      goalKm,
      handleStart,
      prItems,
      progressPct,
      selectedType,
      weekCount,
      weekKcal,
      weekKm,
      weekSeconds,
    ],
  );

  return (
    <View className="flex-1 bg-bg-base">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <FlatList
          data={activities}
          keyExtractor={item => item._id}
          renderItem={renderActivity}
          ListHeaderComponent={listHeader}
          ListFooterComponent={<View style={{ height: 120 }} />}
          contentContainerStyle={{ paddingHorizontal: 22 }}
          showsVerticalScrollIndicator={false}
          bounces
          overScrollMode="never"
          alwaysBounceVertical={false}
          removeClippedSubviews
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={5}
        />
      </SafeAreaView>
    </View>
  );
}
