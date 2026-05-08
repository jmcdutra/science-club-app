import { CheckCircle, Scales, Swap } from 'phosphor-react-native';
import { Pressable, View } from 'react-native';

import { AppText } from '@/src/shared/components/ui/AppText';
import { useAppTheme } from '@/src/shared/theme/appTheme';
import { cn } from '@/src/shared/utils/cn';

import { DietFood, FoodLog } from '../types';
import { formatMacro } from '../utils';

type DietFoodRowProps = {
  food: DietFood;
  log?: FoodLog;
  onLog: () => void;
  onSwap?: () => void;
  isLast?: boolean;
};

export function DietFoodRow({ food, log, onLog, onSwap, isLast }: DietFoodRowProps) {
  const { isDark } = useAppTheme();
  const hasLog = Boolean(log);
  const displayName = log?.selectedFoodName ?? food.name;
  const grams = log?.actualGrams ?? food.plannedGrams;
  const nutrition = log?.nutrition ?? food.nutrition;

  return (
    <View 
      className="py-6"
      style={!isLast ? { borderBottomWidth: 1, borderBottomColor: isDark ? '#1A1A1A' : '#F3F4F6' } : undefined}
    >
      <View className="flex-row items-start gap-4">
        <View className={cn(
          "h-10 w-10 items-center justify-center rounded-full mt-1",
          hasLog ? "bg-green-500/10" : "bg-bg-surface border border-border-subtle"
        )}>
          {hasLog ? (
             <CheckCircle color="#22C55E" size={20} weight="fill" />
          ) : (
             <Scales color={isDark ? '#888888' : '#666666'} size={18} weight="duotone" />
          )}
        </View>

        <View className="flex-1">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <AppText className={cn(
                "text-lg font-semibold tracking-tight leading-tight",
                hasLog && "opacity-60"
              )}>
                {displayName}
              </AppText>
              <AppText className="mt-1 text-sm text-text-muted">
                {hasLog ? `${Math.round(grams)}g registrados` : `${food.displayQuantity} prescritos`}
              </AppText>
            </View>
            <View className="items-end">
              <AppText className="text-sm font-bold text-text-main">{Math.round(nutrition.calories)} kcal</AppText>
              <View className="flex-row gap-2 mt-1">
                 <AppText className="text-[10px] font-bold text-sky-400 uppercase tracking-tighter">P{formatMacro(nutrition.protein)}</AppText>
                 <AppText className="text-[10px] font-bold text-amber-400 uppercase tracking-tighter">C{formatMacro(nutrition.carbs)}</AppText>
                 <AppText className="text-[10px] font-bold text-rose-400 uppercase tracking-tighter">G{formatMacro(nutrition.fat)}</AppText>
              </View>
            </View>
          </View>

          <View className="mt-5 flex-row gap-2.5">
            <Pressable
              accessibilityRole="button"
              className={cn(
                "h-10 px-6 items-center justify-center rounded-2xl",
                hasLog ? "bg-bg-surface border border-border-subtle" : "bg-brand-primary"
              )}
              onPress={onLog}
            >
              <AppText className={cn("text-xs font-bold uppercase tracking-widest", hasLog ? "text-text-main" : "text-white")}>
                {hasLog ? 'Editar' : 'Pesar'}
              </AppText>
            </Pressable>

            {food.substitutions?.length && !hasLog ? (
              <Pressable
                accessibilityRole="button"
                className="h-10 px-6 items-center justify-center rounded-2xl bg-bg-surface border border-border-subtle"
                onPress={onSwap}
              >
                <AppText className="text-xs font-bold uppercase tracking-widest text-text-main">Trocar</AppText>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}
