import { Barbell, PersonSimpleRun, PersonSimpleTaiChi } from 'phosphor-react-native';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';

import { cn } from '@/src/shared/utils/cn';

type ExerciseVisualProps = {
  muscle: string;
  size?: 'sm' | 'lg';
  muted?: boolean;
};

const muscleColor: Record<string, string> = {
  Abdomen: '#8B5CF6',
  Core: '#8B5CF6',
  Quadriceps: '#F59E0B',
  Pernas: '#F59E0B',
  Dorsais: '#38BDF8',
  Biceps: '#A78BFA',
  Triceps: '#C084FC',
  Peitoral: '#FF6B9A',
  Posterior: '#FFB86B',
  Ombros: '#7DD3FC',
  Gluteos: '#FB7185',
  Panturrilhas: '#FCD34D',
};

export function ExerciseVisual({ muscle, muted, size = 'sm' }: ExerciseVisualProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const accent = muscleColor[muscle] ?? '#8B5CF6';
  const Icon = muscle === 'Core' || muscle === 'Abdomen' ? PersonSimpleTaiChi : muscle === 'Pernas' || muscle === 'Quadriceps' ? PersonSimpleRun : Barbell;

  return (
    <View className={cn('items-center justify-center', size === 'lg' ? 'h-64 w-full' : 'h-24 w-28')}>
      <View
        className={cn(
          'items-center justify-center rounded-full border',
          size === 'lg' ? 'h-52 w-52' : 'h-20 w-20',
          muted ? 'opacity-35' : 'opacity-100',
        )}
        style={{
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(17,24,39,0.08)',
          backgroundColor: isDark ? 'rgba(255,255,255,0.035)' : 'rgba(17,24,39,0.035)',
        }}
      >
        <View
          className={cn('absolute rounded-full', size === 'lg' ? 'h-28 w-28' : 'h-12 w-12')}
          style={{ backgroundColor: `${accent}22` }}
        />
        <View
          className={cn('absolute rounded-full', size === 'lg' ? 'h-16 w-16' : 'h-8 w-8')}
          style={{ backgroundColor: `${accent}55` }}
        />
        <Icon color={muted ? (isDark ? '#6B7280' : '#9CA3AF') : accent} size={size === 'lg' ? 132 : 54} weight="duotone" />
      </View>
    </View>
  );
}
