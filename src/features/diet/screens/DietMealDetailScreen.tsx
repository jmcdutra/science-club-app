import { ArrowCounterClockwise, ArrowLeft, CheckCircle, Prohibit, Scales } from 'phosphor-react-native';
import { router, type Href, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppScreen } from '@/src/shared/components/ui/AppScreen';
import { AppText } from '@/src/shared/components/ui/AppText';
import { useAppTheme } from '@/src/shared/theme/appTheme';

import { DietFoodRow } from '../components/DietFoodRow';
import { MacroProgress } from '../components/MacroProgress';
import { useDietStore, useSelectedDietDay } from '../services/diet.store';
import {
  getFoodLog,
  getMealConsumedMacros,
  getMealLog,
  getMealStatus,
  getMealTotal,
  getStatusLabel,
} from '../utils';

export function DietMealDetailScreen() {
  const { mealId } = useLocalSearchParams<{ mealId: string }>();
  const { isDark } = useAppTheme();
  const plan = useDietStore((state) => state.plan);
  const markMealConsumed = useDietStore((state) => state.markMealConsumed);
  const skipMeal = useDietStore((state) => state.skipMeal);
  const resetMeal = useDietStore((state) => state.resetMeal);
  const dayLog = useSelectedDietDay();
  const meal = plan.meals.find((item) => item.id === mealId) ?? plan.meals[0];
  const mealLog = getMealLog(dayLog, meal.id);
  const status = getMealStatus(meal, mealLog);
  const plannedTotal = getMealTotal(meal);
  const consumedTotal = getMealConsumedMacros(mealLog);

  const confirmSkip = () => {
    Alert.alert('Pular refeição?', 'Ela ficará registrada como pulada hoje.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Pular', style: 'destructive', onPress: () => skipMeal(meal.id) },
    ]);
  };

  return (
    <AppScreen contentClassName="px-6 pb-48 pt-8">
      {/* Minimal Header */}
      <View className="mb-10 flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center rounded-full bg-bg-surface border border-border-subtle"
          onPress={() => router.back()}
        >
          <ArrowLeft color={isDark ? '#FFFFFF' : '#111827'} size={20} weight="bold" />
        </Pressable>
        <AppText className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">
          {meal.time}
        </AppText>
        <Pressable
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center rounded-full bg-bg-surface border border-border-subtle"
          onPress={() => resetMeal(meal.id)}
        >
          <ArrowCounterClockwise color="#A78BFA" size={18} weight="bold" />
        </Pressable>
      </View>

      {/* Meal Hero */}
      <Animated.View entering={FadeInDown.duration(600)}>
        <View className="mb-4">
          <AppText className="text-text-muted text-xs font-bold tracking-[0.3em] uppercase mb-3">
            {meal.context} • {getStatusLabel(status)}
          </AppText>
          <AppText className="font-heading text-5xl font-bold text-text-main tracking-tight leading-[1.05]">
            {meal.name}
          </AppText>
          {meal.notes && (
            <AppText className="mt-3 text-base leading-relaxed text-text-muted">
              {meal.notes}
            </AppText>
          )}
        </View>

        {/* Stats Summary */}
        <View className="flex-row items-center gap-6 mt-6 mb-10">
           <View className="flex-row items-baseline gap-1.5">
             <AppText className="text-2xl font-bold text-text-main">{Math.round(plannedTotal.calories)}</AppText>
             <AppText className="text-xs text-text-muted uppercase tracking-widest font-bold">kcal</AppText>
           </View>
           <View className="flex-row items-baseline gap-1.5">
             <AppText className="text-2xl font-bold text-text-main">{Math.round(plannedTotal.protein)}g</AppText>
             <AppText className="text-xs text-text-muted uppercase tracking-widest font-bold">P</AppText>
           </View>
           <View className="flex-row items-baseline gap-1.5">
             <AppText className="text-2xl font-bold text-text-main">{Math.round(plannedTotal.carbs)}g</AppText>
             <AppText className="text-xs text-text-muted uppercase tracking-widest font-bold">C</AppText>
           </View>
        </View>

        {/* Progress Bars (Subtle) */}
        <View className="mb-12">
           <MacroProgress label="Consumo da Refeição" value={consumedTotal.calories} target={plannedTotal.calories} unit="kcal" tone="calories" />
        </View>
      </Animated.View>

      {/* Food List */}
      <Animated.View entering={FadeInDown.delay(100).duration(600)} className="mb-12">
        <View className="flex-row items-end justify-between border-b border-border-subtle pb-4 mb-2">
          <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">Alimentos</AppText>
          <AppText className="text-xs text-text-muted">{meal.foods.length} itens</AppText>
        </View>

        <View>
          {meal.foods.map((food, index) => (
            <DietFoodRow
              key={food.id}
              food={food}
              log={getFoodLog(mealLog, food.id)}
              isLast={index === meal.foods.length - 1}
              onLog={() => router.push(`/(app)/diet/log?mealId=${meal.id}&foodId=${food.id}` as Href)}
              onSwap={() => {
                const replacement = food.substitutions?.[0];
                router.push(`/(app)/diet/log?mealId=${meal.id}&foodId=${food.id}&replacementId=${replacement?.id ?? ''}` as Href);
              }}
            />
          ))}
        </View>
      </Animated.View>

      {/* Actions */}
      <Animated.View entering={FadeInDown.delay(200).duration(600)} className="gap-3">
        <Pressable
          accessibilityRole="button"
          className="min-h-[56px] flex-row items-center justify-center gap-3 rounded-2xl bg-brand-primary"
          onPress={() => markMealConsumed(meal.id)}
        >
          <CheckCircle color="#FFFFFF" size={20} weight="bold" />
          <AppText className="text-base font-bold text-white">Marcar como Consumida</AppText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          className="min-h-[56px] flex-row items-center justify-center gap-2 rounded-2xl bg-bg-surface border border-border-subtle"
          onPress={() => router.push(`/(app)/diet/log?mealId=${meal.id}` as Href)}
        >
          <Scales color="#A78BFA" size={20} weight="bold" />
          <AppText className="text-base font-bold text-text-main">Registrar com Balança</AppText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          className="min-h-[56px] flex-row items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10"
          onPress={confirmSkip}
        >
          <Prohibit color="#FCA5A5" size={18} weight="bold" />
          <AppText className="text-base font-bold text-red-400">Pular Refeição</AppText>
        </Pressable>
      </Animated.View>
    </AppScreen>
  );
}
