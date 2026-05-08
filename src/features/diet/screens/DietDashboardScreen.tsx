import Svg, { Circle } from 'react-native-svg';
import { CaretRight, Drop, Minus, Notebook, Plus } from 'phosphor-react-native';
import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppShell } from '@/src/shared/components/layout/AppShell';
import { AppText } from '@/src/shared/components/ui/AppText';
import { useAppTheme } from '@/src/shared/theme/appTheme';

import { useDietStore, useSelectedDietDay } from '../services/diet.store';
import {
  getAdherence,
  getConsumedMacros,
  getMealLog,
  getMealStatus,
  getMealTotal,
  getNextMeal,
  getProgressPercent,
} from '../utils';

const STATUS_COLOR: Record<string, string> = {
  pending: '#3A3A3A',
  partial: '#FBBF24',
  done: '#22C55E',
  skipped: '#52525B',
};

function Ring({ size = 44, sw = 4, pct, color }: { size?: number; sw?: number; pct: number; color: string }) {
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, pct)) / 100) * circ;
  const cx = size / 2;
  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cx} r={r} stroke={`${color}22`} strokeWidth={sw} fill="none" />
      <Circle
        cx={cx}
        cy={cx}
        r={r}
        stroke={color}
        strokeWidth={sw}
        fill="none"
        strokeDasharray={`${circ} ${circ}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${cx}, ${cx}`}
      />
    </Svg>
  );
}

export function DietDashboardScreen() {
  const { isDark } = useAppTheme();
  const plan = useDietStore((state) => state.plan);
  const addWater = useDietStore((state) => state.addWater);
  const dayLog = useSelectedDietDay();
  const consumed = getConsumedMacros(dayLog);
  const adherence = getAdherence(plan, dayLog);
  const nextMeal = getNextMeal(plan, dayLog);
  const waterPercent = getProgressPercent(dayLog.waterMl, plan.targets.waterMl);

  const cellBg = isDark ? '#111111' : '#F5F5F5';
  const cellBorder = isDark ? '#1E1E1E' : '#EBEBEB';
  const dividerColor = isDark ? '#1A1A1A' : '#F0F0F0';

  const macros = [
    {
      label: 'Calorias',
      consumed: Math.round(consumed.calories),
      target: plan.targets.calories,
      remaining: Math.max(0, plan.targets.calories - consumed.calories),
      unit: 'kcal',
      color: '#8B5CF6',
      pct: getProgressPercent(consumed.calories, plan.targets.calories),
      over: consumed.calories > plan.targets.calories,
    },
    {
      label: 'Proteína',
      consumed: Math.round(consumed.protein),
      target: plan.targets.protein,
      remaining: Math.max(0, plan.targets.protein - consumed.protein),
      unit: 'g',
      color: '#38BDF8',
      pct: getProgressPercent(consumed.protein, plan.targets.protein),
      over: consumed.protein > plan.targets.protein,
    },
    {
      label: 'Carboidratos',
      consumed: Math.round(consumed.carbs),
      target: plan.targets.carbs,
      remaining: Math.max(0, plan.targets.carbs - consumed.carbs),
      unit: 'g',
      color: '#F59E0B',
      pct: getProgressPercent(consumed.carbs, plan.targets.carbs),
      over: consumed.carbs > plan.targets.carbs,
    },
    {
      label: 'Gorduras',
      consumed: Math.round(consumed.fat),
      target: plan.targets.fat,
      remaining: Math.max(0, plan.targets.fat - consumed.fat),
      unit: 'g',
      color: '#FB7185',
      pct: getProgressPercent(consumed.fat, plan.targets.fat),
      over: consumed.fat > plan.targets.fat,
    },
  ];

  return (
    <AppShell title="Sua Dieta" contentClassName="pb-36">

      {/* ─── PLANO BANNER ─────────────────────── */}
      <Animated.View entering={FadeInDown.delay(100).duration(600)} className="mb-6">
        <Pressable
          accessibilityRole="button"
          style={{
            borderRadius: 20,
            borderWidth: 1,
            borderColor: cellBorder,
            backgroundColor: cellBg,
            paddingHorizontal: 16,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
          }}
          onPress={() => router.push('/(app)/diet/plan' as Href)}
        >
          <View style={{ flex: 1 }}>
            <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em] mb-1">
              {plan.professional} · v{plan.version}
            </AppText>
            <AppText className="text-base font-bold text-text-main">{plan.name}</AppText>
            <AppText className="text-xs text-text-muted mt-0.5" numberOfLines={1}>
              {plan.objective}
            </AppText>
          </View>
          <Notebook color="#A78BFA" size={22} weight="duotone" style={{ marginLeft: 12 }} />
        </Pressable>
      </Animated.View>

      {/* ─── METAS DO DIA ─────────────────────── */}
      <Animated.View entering={FadeInDown.delay(200).duration(600)} className="mb-8">
        <View className="flex-row items-center justify-between border-b border-border-subtle pb-4 mb-5">
          <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">
            Metas de Hoje
          </AppText>
          <View
            style={{
              backgroundColor: adherence >= 80 ? '#22C55E18' : '#F59E0B18',
              borderRadius: 99,
              paddingHorizontal: 9,
              paddingVertical: 4,
            }}
          >
            <AppText
              className="text-[10px] font-bold uppercase tracking-wide"
              style={{ color: adherence >= 80 ? '#22C55E' : '#F59E0B' }}
            >
              {adherence}% aderência
            </AppText>
          </View>
        </View>

        {/* 2×2 macro ring grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {macros.map((macro) => (
            <View
              key={macro.label}
              style={{
                width: '47.5%',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: cellBorder,
                backgroundColor: cellBg,
                padding: 14,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <AppText className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
                  {macro.label}
                </AppText>
                <Ring size={38} sw={3.5} pct={macro.pct} color={macro.color} />
              </View>

              {macro.over ? (
                <AppText className="text-xl font-bold" style={{ color: '#FB7185', letterSpacing: -0.5 }}>
                  Meta!
                </AppText>
              ) : (
                <AppText className="text-xl font-bold text-text-main" style={{ letterSpacing: -0.5 }}>
                  {Math.round(macro.remaining)}
                  <AppText className="text-xs font-normal text-text-muted"> {macro.unit}</AppText>
                </AppText>
              )}
              <AppText className="text-[11px] text-text-muted mt-0.5">
                {macro.consumed}/{macro.target}{macro.unit}
              </AppText>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* ─── ÁGUA ─────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(340).duration(600)} className="mb-8">
        <View
          style={{
            borderRadius: 18,
            borderWidth: 1,
            borderColor: cellBorder,
            backgroundColor: cellBg,
            padding: 14,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Drop color="#22D3EE" size={16} weight="duotone" />
            <AppText className="text-sm font-bold text-text-main" style={{ flex: 1 }}>Hidratação</AppText>
            <AppText className="text-sm font-bold text-cyan-400">
              {dayLog.waterMl}
              <AppText className="font-normal text-text-muted"> / {plan.targets.waterMl}ml</AppText>
            </AppText>
          </View>

          <View className="h-1.5 rounded-full bg-cyan-400/15 overflow-hidden mb-3">
            <View
              className="h-full rounded-full bg-cyan-400"
              style={{ width: `${Math.min(100, waterPercent)}%` }}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[250, 500].map((ml) => (
              <Pressable
                key={ml}
                className="flex-1 h-10 flex-row items-center justify-center rounded-xl bg-cyan-400/10 gap-1.5"
                onPress={() => addWater(ml)}
              >
                <Plus color="#22D3EE" size={13} weight="bold" />
                <AppText className="text-sm font-bold text-cyan-500">{ml}ml</AppText>
              </Pressable>
            ))}
            <Pressable
              className="w-10 h-10 items-center justify-center rounded-xl bg-red-400/10"
              onPress={() => addWater(-250)}
            >
              <Minus color="#F87171" size={13} weight="bold" />
            </Pressable>
          </View>
        </View>
      </Animated.View>

      {/* ─── LOG DE REFEIÇÕES ─────────────────── */}
      <Animated.View entering={FadeInDown.delay(460).duration(600)} className="mb-8">
        <View className="flex-row items-center justify-between border-b border-border-subtle pb-4 mb-1">
          <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">
            Refeições
          </AppText>
          <AppText className="text-xs text-text-muted">{plan.meals.length} refeições</AppText>
        </View>

        <View>
          {plan.meals.map((meal, mealIdx) => {
            const mealLog = getMealLog(dayLog, meal.id);
            const status = getMealStatus(meal, mealLog);
            const mealTotal = getMealTotal(meal);
            const isNext = meal.id === nextMeal.id;
            const isLast = mealIdx === plan.meals.length - 1;
            const showFoods = isNext || status === 'done' || status === 'partial';

            return (
              <View
                key={meal.id}
                style={!isLast ? { borderBottomWidth: 1, borderBottomColor: dividerColor } : undefined}
              >
                {/* Meal row */}
                <Pressable
                  accessibilityRole="button"
                  style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => router.push(`/(app)/diet/meals/${meal.id}` as Href)}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: STATUS_COLOR[status] ?? '#3A3A3A',
                      marginRight: 12,
                    }}
                  />
                  <AppText className="text-xs text-text-muted" style={{ width: 42 }}>
                    {meal.time}
                  </AppText>
                  <AppText
                    className={`flex-1 text-base font-bold ${isNext ? 'text-brand-secondary' : 'text-text-main'}`}
                  >
                    {meal.name}
                  </AppText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {isNext && (
                      <View
                        style={{
                          backgroundColor: '#8B5CF618',
                          borderRadius: 99,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                        }}
                      >
                        <AppText className="text-[10px] font-bold text-brand-secondary uppercase tracking-wide">
                          Agora
                        </AppText>
                      </View>
                    )}
                    <AppText className="text-xs text-text-muted">
                      {Math.round(mealTotal.calories)} kcal
                    </AppText>
                    <CaretRight color={isDark ? '#333' : '#CCC'} size={13} weight="bold" />
                  </View>
                </Pressable>

                {/* Food items preview */}
                {showFoods && meal.foods.length > 0 && (
                  <View style={{ paddingLeft: 56, paddingBottom: 10 }}>
                    {meal.foods.slice(0, 3).map((food) => (
                      <View
                        key={food.id}
                        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 3 }}
                      >
                        <View
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: isDark ? '#2E2E2E' : '#DADADA',
                            marginRight: 8,
                          }}
                        />
                        <AppText className="text-sm text-text-muted flex-1" numberOfLines={1}>
                          {food.name}
                        </AppText>
                        <AppText className="text-xs text-text-muted">{food.displayQuantity}</AppText>
                        <AppText
                          className="text-xs font-bold text-text-muted"
                          style={{ marginLeft: 10, minWidth: 48, textAlign: 'right' }}
                        >
                          {food.nutrition.calories} kcal
                        </AppText>
                      </View>
                    ))}
                    {meal.foods.length > 3 && (
                      <AppText className="text-xs text-text-muted mt-1.5">
                        +{meal.foods.length - 3} alimentos
                      </AppText>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </Animated.View>
    </AppShell>
  );
}
