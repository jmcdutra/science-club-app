import { ArrowLeft, CaretRight, Drop, NotePencil, Pill, UserCircle } from 'phosphor-react-native';
import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { AppScreen } from '@/src/shared/components/ui/AppScreen';
import { AppText } from '@/src/shared/components/ui/AppText';
import { useAppTheme } from '@/src/shared/theme/appTheme';
import { useAuthStore } from '@/src/features/auth/services/auth.store';

import { MacroProgress } from '../components/MacroProgress';
import { useDietStore } from '../services/diet.store';
import { getCurrentDiet } from '../api/diet';
import { getMealTotal, getPlanTotal } from '../utils';

export function DietPlanScreen() {
  const { isDark } = useAppTheme();
  const { session } = useAuthStore();
  const plan = useDietStore((state) => state.plan);
  const setRemoteData = useDietStore((state) => state.setRemoteData);
  const { data } = useQuery({
    queryKey: ['student-diet-current'],
    queryFn: () => getCurrentDiet(session?.token!),
    enabled: !!session?.token,
  });
  useEffect(() => {
    if (data?.diet && data?.dayLog) setRemoteData(data.diet, data.dayLog);
  }, [data?.diet, data?.dayLog, setRemoteData]);
  const planTotal = getPlanTotal(plan);

  return (
    <AppScreen contentClassName="px-6 pb-48 pt-8">
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
          v{plan.version} • {plan.updatedAt}
        </AppText>
        <View className="h-11 w-11 items-center justify-center rounded-full bg-bg-surface border border-border-subtle">
          <UserCircle color="#A78BFA" size={20} weight="duotone" />
        </View>
      </View>

      {/* Plan Hero */}
      <Animated.View entering={FadeInDown.duration(600)}>
        <View className="mb-4">
          <AppText className="text-text-muted text-xs font-bold tracking-[0.3em] uppercase mb-3">
            {plan.professional}
          </AppText>
          <AppText className="font-heading text-3xl font-bold text-text-main">
            {plan.name}
          </AppText>
          <AppText className="mt-3 text-base leading-relaxed text-text-muted">
            {plan.objective}
          </AppText>
        </View>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap gap-x-8 gap-y-6 mt-8 mb-12">
           <View className="flex-1 min-w-[120px]">
             <MacroProgress label="Calorias" value={planTotal.calories} target={plan.targets.calories} unit="kcal" tone="calories" />
           </View>
           <View className="flex-1 min-w-[120px]">
             <MacroProgress label="Proteína" value={planTotal.protein} target={plan.targets.protein} tone="protein" />
           </View>
           <View className="flex-1 min-w-[120px]">
             <MacroProgress label="Carbos" value={planTotal.carbs} target={plan.targets.carbs} tone="carbs" />
           </View>
           <View className="flex-1 min-w-[120px]">
             <MacroProgress label="Gorduras" value={planTotal.fat} target={plan.targets.fat} tone="fat" />
           </View>
        </View>
      </Animated.View>

      {/* Guidance Sections */}
      <Animated.View entering={FadeInDown.delay(100).duration(600)} className="mb-14">
        {[
          { label: 'Hidratação', icon: Drop, text: plan.waterGuidance, color: '#67E8F9' },
          { label: 'Suplementação', icon: Pill, text: plan.supplementGuidance, color: '#A78BFA' },
          { label: 'Observações', icon: NotePencil, text: plan.generalNotes, color: '#FCD34D' },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <View 
              key={item.label}
              className="py-6"
              style={index < 2 ? { borderBottomWidth: 1, borderBottomColor: isDark ? '#1A1A1A' : '#F3F4F6' } : undefined}
            >
              <View className="flex-row items-center gap-3 mb-3">
                <View className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: `${item.color}15` }}>
                  <Icon color={item.color} size={16} weight="duotone" />
                </View>
                <AppText className="text-[11px] font-bold uppercase tracking-widest text-text-muted">{item.label}</AppText>
              </View>
              <AppText className="text-base leading-relaxed text-text-main">{item.text}</AppText>
              {item.label === 'Observações' && plan.restrictions && (
                <View className="mt-3 bg-amber-500/10 px-3 py-1.5 rounded-lg self-start">
                   <AppText className="text-xs font-bold text-amber-500 uppercase tracking-widest">Restrições: {plan.restrictions}</AppText>
                </View>
              )}
            </View>
          );
        })}
      </Animated.View>

      {/* Meal List */}
      <Animated.View entering={FadeInDown.delay(200).duration(600)}>
        <View className="flex-row items-end justify-between border-b border-border-subtle pb-4 mb-2">
          <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">Refeições do Plano</AppText>
          <AppText className="text-xs text-text-muted">{plan.meals.length} refeições</AppText>
        </View>

        <View>
          {plan.meals.map((meal, index) => {
            const total = getMealTotal(meal);
            return (
              <Pressable
                key={meal.id}
                accessibilityRole="button"
                className="flex-row items-center py-5"
                style={index < plan.meals.length - 1 ? { borderBottomWidth: 1, borderBottomColor: isDark ? '#1A1A1A' : '#F3F4F6' } : undefined}
                onPress={() => router.push(`/(app)/diet/meals/${meal.id}` as Href)}
              >
                <View className="flex-1">
                  <AppText className="text-lg font-semibold text-text-main tracking-tight">{meal.name}</AppText>
                  <AppText className="mt-0.5 text-sm text-text-muted">
                    {meal.time} • {Math.round(total.calories)} kcal • {meal.foods.length} alimentos
                  </AppText>
                </View>
                <CaretRight color={isDark ? '#555555' : '#9CA3AF'} size={18} weight="bold" />
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
    </AppScreen>
  );
}
