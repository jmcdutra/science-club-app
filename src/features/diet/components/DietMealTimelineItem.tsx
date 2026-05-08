import { CheckCircle, Circle, ForkKnife, MinusCircle, WarningCircle } from 'phosphor-react-native';
import { Pressable, View } from 'react-native';

import { AppText } from '@/src/shared/components/ui/AppText';
import { cn } from '@/src/shared/utils/cn';
import { useAppTheme } from '@/src/shared/theme/appTheme';

import { DietMeal, MealStatus } from '../types';
import { getMealTotal, getStatusLabel } from '../utils';

type DietMealTimelineItemProps = {
  meal: DietMeal;
  status: MealStatus;
  active?: boolean;
  onPress: () => void;
  isLast?: boolean;
};

const statusIcon = {
  pending: Circle,
  partial: WarningCircle,
  done: CheckCircle,
  skipped: MinusCircle,
};

const statusColor = {
  pending: '#71717A',
  partial: '#FBBF24',
  done: '#22C55E',
  skipped: '#A1A1AA',
};

export function DietMealTimelineItem({ meal, status, active, onPress, isLast }: DietMealTimelineItemProps) {
  const { isDark } = useAppTheme();
  const Icon = statusIcon[status];
  const total = getMealTotal(meal);
  const done = status === 'done';

  return (
    <Pressable
      accessibilityRole="button"
      className="flex-row items-center py-5"
      style={!isLast ? { borderBottomWidth: 1, borderBottomColor: isDark ? '#1A1A1A' : '#F3F4F6' } : undefined}
      onPress={onPress}
    >
      <View className={cn(
        'h-10 w-10 items-center justify-center rounded-full mr-4',
        active ? 'bg-brand-primary' : 'bg-bg-surface border border-border-subtle'
      )}>
        <ForkKnife color={active ? '#FFFFFF' : (isDark ? '#888888' : '#666666')} size={18} weight="duotone" />
      </View>
      
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <AppText className={cn(
            'text-lg font-semibold tracking-tight',
            active ? 'text-brand-secondary' : 'text-text-main',
            done && 'text-text-muted line-through opacity-60'
          )}>
            {meal.name}
          </AppText>
          {status !== 'pending' && (
             <Icon color={statusColor[status]} size={14} weight="fill" />
          )}
        </View>
        <AppText className="mt-0.5 text-sm text-text-muted">
          {meal.time} • {Math.round(total.calories)} kcal • {getStatusLabel(status)}
        </AppText>
      </View>

      {active && (
        <View className="bg-brand-primary/10 px-3 py-1 rounded-full border border-brand-primary/20">
          <AppText className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary">Agora</AppText>
        </View>
      )}
    </Pressable>
  );
}
