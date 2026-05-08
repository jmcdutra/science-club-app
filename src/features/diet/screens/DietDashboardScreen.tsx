import { CalendarBlank, Drop, ForkKnife, ListChecks, Minus, Notebook, Plus, Scales } from 'phosphor-react-native';
import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppShell } from '@/src/shared/components/layout/AppShell';
import { AppText } from '@/src/shared/components/ui/AppText';
import { useAppTheme } from '@/src/shared/theme/appTheme';

import { DietMealTimelineItem } from '../components/DietMealTimelineItem';
import { MacroHeroProgress } from '../components/MacroHeroProgress';
import { useDietStore, useSelectedDietDay } from '../services/diet.store';
import {
  getAdherence,
  getConsumedMacros,
  getMealLog,
  getMealStatus,
  getNextMeal,
  getProgressPercent,
} from '../utils';

export function DietDashboardScreen() {
  const { isDark } = useAppTheme();
  const plan = useDietStore((state) => state.plan);
  const addWater = useDietStore((state) => state.addWater);
  const dayLog = useSelectedDietDay();
  const consumed = getConsumedMacros(dayLog);
  const adherence = getAdherence(plan, dayLog);
  const nextMeal = getNextMeal(plan, dayLog);
  const remainingCalories = plan.targets.calories - consumed.calories;
  const caloriePercent = getProgressPercent(consumed.calories, plan.targets.calories);

  return (
    <AppShell title="SUA DIETA" largeTitle contentClassName="pb-36">
      {/* Daily Summary Hero */}
      <Animated.View entering={FadeInDown.delay(200).duration(800)} className="mb-14">
        <View className="flex-row items-end justify-between border-b border-border-subtle pb-4 mb-8">
          <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">Resumo do Dia</AppText>
          <View className="flex-row items-center gap-1.5">
            <AppText className="text-text-main font-bold text-lg">{adherence}%</AppText>
            <AppText className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Aderência</AppText>
          </View>
        </View>

        <View className="flex-row items-start justify-between gap-4 mb-10">
          <View className="flex-1">
            <AppText className="font-heading text-7xl font-bold text-text-main tracking-tighter leading-none">
              {Math.round(consumed.calories)}
            </AppText>
            <AppText className="mt-3 text-base font-medium text-text-muted">
              kcal de {plan.targets.calories} consumidas
            </AppText>
          </View>
          <View className="items-end">
            <AppText className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">
              {remainingCalories >= 0 ? 'Restam' : 'Passou'}
            </AppText>
            <AppText className="text-4xl font-bold text-brand-secondary tracking-tight">
              {Math.abs(Math.round(remainingCalories))}
            </AppText>
          </View>
        </View>

        <View className="mb-10">
          <MacroHeroProgress 
            protein={{ value: consumed.protein, target: plan.targets.protein }}
            carbs={{ value: consumed.carbs, target: plan.targets.carbs }}
            fat={{ value: consumed.fat, target: plan.targets.fat }}
          />
        </View>

        <View className="h-1.5 rounded-full bg-border-subtle/30 overflow-hidden">
          <View className="h-full rounded-full bg-brand-primary" style={{ width: `${Math.min(100, caloriePercent)}%` }} />
        </View>
      </Animated.View>

      {/* Next Meal Hero */}
      <Animated.View entering={FadeInDown.delay(400).duration(800)} className="mb-14">
        <View className="flex-row items-end justify-between border-b border-border-subtle pb-4 mb-8">
          <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">Próxima Refeição</AppText>
          <AppText className="text-text-main font-bold text-base">{nextMeal.time}</AppText>
        </View>

        <Pressable
          accessibilityRole="button"
          className="flex-row items-center justify-between bg-bg-surface p-6 rounded-[32px] border border-border-subtle shadow-sm"
          onPress={() => router.push(`/(app)/diet/meals/${nextMeal.id}` as Href)}
        >
          <View className="flex-1">
            <AppText className="font-heading text-3xl font-bold text-text-main mb-1.5 leading-tight">{nextMeal.name}</AppText>
            <AppText className="text-base text-text-muted leading-relaxed">
              {nextMeal.foods.map((food) => food.name).slice(0, 2).join(' + ')}
              {nextMeal.foods.length > 2 && '...'}
            </AppText>
          </View>
          <View className="w-16 h-16 rounded-full bg-brand-primary items-center justify-center shadow-lg shadow-brand-primary/40 ml-4">
             <ForkKnife size={28} color="#FFFFFF" weight="fill" />
          </View>
        </Pressable>
      </Animated.View>

      {/* Water & Utilities */}
      <Animated.View entering={FadeInDown.delay(600).duration(800)} className="mb-14">
        <View className="bg-bg-surface rounded-[32px] border border-border-subtle p-6 mb-4">
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center gap-4">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-cyan-300/10">
                <Drop color="#67E8F9" size={24} weight="duotone" />
              </View>
              <View>
                <AppText className="text-lg font-bold text-text-main">Hidratação</AppText>
                <AppText className="text-sm text-text-muted">{dayLog.waterMl}ml de {plan.targets.waterMl}ml</AppText>
              </View>
            </View>
          </View>

          <View className="flex-row gap-3">
            <Pressable 
              className="flex-1 h-14 flex-row items-center justify-center bg-cyan-300/10 rounded-2xl gap-2"
              onPress={() => addWater(250)}
            >
              <Plus color="#22D3EE" size={18} weight="bold" />
              <AppText className="text-sm font-bold text-cyan-500">250ml</AppText>
            </Pressable>
            <Pressable 
              className="flex-1 h-14 flex-row items-center justify-center bg-cyan-300/10 rounded-2xl gap-2"
              onPress={() => addWater(500)}
            >
              <Plus color="#22D3EE" size={18} weight="bold" />
              <AppText className="text-sm font-bold text-cyan-500">500ml</AppText>
            </Pressable>
            <Pressable 
              className="w-14 h-14 items-center justify-center bg-red-400/10 rounded-2xl"
              onPress={() => addWater(-250)}
            >
              <Minus color="#F87171" size={18} weight="bold" />
            </Pressable>
          </View>
        </View>

        <View className="flex-row gap-4">
          {[
            { label: 'Plano', icon: Notebook, href: '/(app)/diet/plan' },
            { label: 'Balança', icon: Scales, href: '/(app)/diet/log' },
            { label: 'Histórico', icon: ListChecks, href: '/(app)/diet/history' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Pressable
                key={item.label}
                accessibilityRole="button"
                className="flex-1 h-24 items-center justify-center rounded-[28px] bg-bg-surface border border-border-subtle"
                onPress={() => router.push(item.href as Href)}
              >
                <Icon color="#A78BFA" size={24} weight="duotone" />
                <AppText className="mt-2 text-xs font-bold uppercase tracking-widest text-text-main">{item.label}</AppText>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* Full Timeline */}
      <Animated.View entering={FadeInDown.delay(800).duration(800)}>
        <View className="flex-row items-end justify-between border-b border-border-subtle pb-4 mb-2">
          <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">Timeline de hoje</AppText>
          <AppText className="text-xs text-text-muted">{plan.meals.length} refeições</AppText>
        </View>

        <View>
          {plan.meals.map((meal, index) => {
            const status = getMealStatus(meal, getMealLog(dayLog, meal.id));
            return (
              <DietMealTimelineItem
                key={meal.id}
                active={meal.id === nextMeal.id}
                meal={meal}
                status={status}
                isLast={index === plan.meals.length - 1}
                onPress={() => router.push(`/(app)/diet/meals/${meal.id}` as Href)}
              />
            );
          })}
        </View>
      </Animated.View>
    </AppShell>
  );
}
