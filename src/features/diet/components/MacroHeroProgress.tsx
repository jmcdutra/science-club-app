import { View } from 'react-native';

import { AppText } from '@/src/shared/components/ui/AppText';
import { getProgressPercent } from '../utils';

type MacroHeroProgressProps = {
  protein: { value: number; target: number };
  carbs: { value: number; target: number };
  fat: { value: number; target: number };
};

export function MacroHeroProgress({ protein, carbs, fat }: MacroHeroProgressProps) {
  const pPercent = Math.min(100, getProgressPercent(protein.value, protein.target));
  const cPercent = Math.min(100, getProgressPercent(carbs.value, carbs.target));
  const fPercent = Math.min(100, getProgressPercent(fat.value, fat.target));

  return (
    <View className="gap-4">
      <View>
        <View className="flex-row justify-between mb-1.5 px-1">
          <AppText className="text-[10px] font-black text-sky-500 uppercase tracking-[0.2em]">Proteína</AppText>
          <AppText className="text-[10px] font-bold text-text-muted">{Math.round(protein.value)}g / {protein.target}g</AppText>
        </View>
        <View className="h-2.5 rounded-full bg-sky-500/10 overflow-hidden border border-sky-500/20">
          <View className="h-full rounded-full bg-sky-500 shadow-sm" style={{ width: `${pPercent}%` }} />
        </View>
      </View>

      <View>
        <View className="flex-row justify-between mb-1.5 px-1">
          <AppText className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Carboidratos</AppText>
          <AppText className="text-[10px] font-bold text-text-muted">{Math.round(carbs.value)}g / {carbs.target}g</AppText>
        </View>
        <View className="h-2.5 rounded-full bg-amber-500/10 overflow-hidden border border-amber-500/20">
          <View className="h-full rounded-full bg-amber-500 shadow-sm" style={{ width: `${cPercent}%` }} />
        </View>
      </View>

      <View>
        <View className="flex-row justify-between mb-1.5 px-1">
          <AppText className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Gorduras</AppText>
          <AppText className="text-[10px] font-bold text-text-muted">{Math.round(fat.value)}g / {fat.target}g</AppText>
        </View>
        <View className="h-2.5 rounded-full bg-rose-500/10 overflow-hidden border border-rose-500/20">
          <View className="h-full rounded-full bg-rose-500 shadow-sm" style={{ width: `${fPercent}%` }} />
        </View>
      </View>
    </View>
  );
}
