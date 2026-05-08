import { View } from 'react-native';

import { AppText } from '@/src/shared/components/ui/AppText';
import { cn } from '@/src/shared/utils/cn';

import { getProgressPercent } from '../utils';

type MacroProgressProps = {
  label: string;
  value: number;
  target: number;
  unit?: string;
  tone?: 'protein' | 'carbs' | 'fat' | 'calories' | 'water';
};

const toneClasses = {
  protein: 'bg-sky-400',
  carbs: 'bg-amber-300',
  fat: 'bg-rose-400',
  calories: 'bg-brand-primary',
  water: 'bg-cyan-300',
};

export function MacroProgress({ label, value, target, unit = 'g', tone = 'calories' }: MacroProgressProps) {
  const percent = getProgressPercent(value, target);

  return (
    <View className="mb-4">
      <View className="mb-2 flex-row items-baseline justify-between">
        <AppText className="text-[11px] font-bold uppercase tracking-widest text-text-muted">{label}</AppText>
        <AppText className="text-xs font-semibold text-text-main">
          {Math.round(value)}{unit}
          <AppText className="text-[10px] font-medium text-text-muted"> / {target}{unit}</AppText>
        </AppText>
      </View>
      <View className="h-1 rounded-full bg-border-subtle/50">
        <View 
          className={cn('h-full rounded-full', toneClasses[tone])} 
          style={{ width: `${Math.min(100, percent)}%` }} 
        />
      </View>
    </View>
  );
}
