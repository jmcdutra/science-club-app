import { ArrowLeft, CalendarBlank, ChartLineUp, ForkKnife, TrendUp } from 'phosphor-react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppScreen } from '@/src/shared/components/ui/AppScreen';
import { AppText } from '@/src/shared/components/ui/AppText';
import { useAppTheme } from '@/src/shared/theme/appTheme';
import { cn } from '@/src/shared/utils/cn';

import { MacroProgress } from '../components/MacroProgress';
import { useDietStore } from '../services/diet.store';
import {
  formatShortDate,
  getAdherence,
  getConsumedMacros,
  getMealLog,
  getMealStatus,
  getStatusLabel,
  getProgressPercent,
} from '../utils';

export function DietHistoryScreen() {
  const { isDark } = useAppTheme();
  const plan = useDietStore((state) => state.plan);
  const activeDate = useDietStore((state) => state.selectedDate);
  const dayLogs = useDietStore((state) => state.dayLogs);
  const availableDates = Object.keys(dayLogs).sort();
  const [selectedDate, setSelectedDate] = useState(activeDate);
  const selectedLog = dayLogs[selectedDate] ?? dayLogs[availableDates[availableDates.length - 1]];
  const consumed = getConsumedMacros(selectedLog);
  const adherence = getAdherence(plan, selectedLog);
  const progressions = selectedLog?.mealLogs.filter((mealLog) =>
    mealLog.foodLogs.some((foodLog) => foodLog.actualGrams > foodLog.plannedGrams || foodLog.replacedBy),
  ).length ?? 0;

  return (
    <AppScreen contentClassName="px-6 pb-32 pt-8">
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
          Histórico Alimentar
        </AppText>
        <View className="h-11 w-11 items-center justify-center rounded-full bg-bg-surface border border-border-subtle">
          <CalendarBlank color="#A78BFA" size={18} weight="duotone" />
        </View>
      </View>

      {/* Date Selector */}
      <Animated.View entering={FadeInDown.duration(400)} className="mb-10">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
          {availableDates.map((date) => {
            const isSelected = date === selectedDate;
            return (
              <Pressable
                key={date}
                accessibilityRole="button"
                className={cn(
                  'rounded-2xl border px-5 py-3',
                  isSelected ? 'border-brand-primary bg-brand-primary' : 'border-border-subtle bg-bg-surface',
                )}
                onPress={() => setSelectedDate(date)}
              >
                <AppText className={cn('text-sm font-bold', isSelected ? 'text-white' : 'text-text-main')}>
                  {formatShortDate(date)}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Summary Hero */}
      <Animated.View entering={FadeInDown.delay(100).duration(600)} className="mb-14">
        <View className="flex-row items-end justify-between border-b border-border-subtle pb-4 mb-8">
          <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">Resumo do Dia</AppText>
          <AppText className="text-brand-secondary font-bold text-base">{adherence}% aderência</AppText>
        </View>

        <View className="flex-row items-start justify-between gap-4 mb-10">
          <View className="flex-1">
            <AppText className="font-heading text-5xl font-bold text-text-main tracking-tighter leading-none">
              {Math.round(consumed.calories)}
            </AppText>
            <AppText className="mt-3 text-base text-text-muted">kcal consumidas</AppText>
          </View>
          <View className="flex-row gap-4">
             <View className="items-center">
                <AppText className="text-xl font-bold text-text-main">{selectedLog?.mealLogs.length ?? 0}</AppText>
                <AppText className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Refeições</AppText>
             </View>
             <View className="items-center">
                <AppText className="text-xl font-bold text-text-main">{progressions}</AppText>
                <AppText className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Ajustes</AppText>
             </View>
          </View>
        </View>

        <View className="gap-6 flex-row flex-wrap">
           <View className="flex-1 min-w-[120px]">
             <MacroProgress label="Proteína" value={consumed.protein} target={plan.targets.protein} tone="protein" />
           </View>
           <View className="flex-1 min-w-[120px]">
             <MacroProgress label="Carbos" value={consumed.carbs} target={plan.targets.carbs} tone="carbs" />
           </View>
        </View>
      </Animated.View>

      {/* Meal History List */}
      <Animated.View entering={FadeInDown.delay(200).duration(600)}>
        <View className="flex-row items-end justify-between border-b border-border-subtle pb-4 mb-2">
          <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">Refeições Registradas</AppText>
        </View>

        <View>
          {plan.meals.map((meal, index) => {
            const mealLog = getMealLog(selectedLog, meal.id);
            const status = getMealStatus(meal, mealLog);
            const calories = getConsumedMacros({ date: selectedLog?.date ?? selectedDate, waterMl: 0, mealLogs: mealLog ? [mealLog] : [] }).calories;
            const targetCals = meal.foods.reduce((acc, food) => acc + food.nutrition.calories, 0);
            const percent = getProgressPercent(calories, targetCals);

            return (
              <View 
                key={meal.id} 
                className="py-6"
                style={index < plan.meals.length - 1 ? { borderBottomWidth: 1, borderBottomColor: isDark ? '#1A1A1A' : '#F3F4F6' } : undefined}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-1">
                    <AppText className="text-lg font-semibold text-text-main tracking-tight">{meal.name}</AppText>
                    <AppText className="mt-0.5 text-sm text-text-muted">{meal.time} • {getStatusLabel(status)}</AppText>
                  </View>
                  <AppText className="text-base font-bold text-text-main">{Math.round(calories)} kcal</AppText>
                </View>
                <View className="h-1 rounded-full bg-border-subtle/50">
                  <View className="h-full rounded-full bg-brand-primary" style={{ width: `${Math.min(100, percent)}%` }} />
                </View>
              </View>
            );
          })}
        </View>
      </Animated.View>
    </AppScreen>
  );
}
