import { CaretRight } from 'phosphor-react-native';
import { Pressable, View } from 'react-native';
import { useColorScheme } from 'nativewind';

import { AppText } from '@/src/shared/components/ui/AppText';
import { cn } from '@/src/shared/utils/cn';

import type { WorkoutExercise } from '../data/workoutSheets';
import { ExerciseVisual } from './ExerciseVisual';

type WorkoutExerciseListItemProps = {
  exercise: WorkoutExercise;
  completedSets?: number;
  onPress?: () => void;
};

export function WorkoutExerciseListItem({ exercise, completedSets = 0, onPress }: WorkoutExerciseListItemProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const done = completedSets >= exercise.sets.length;
  const partial = completedSets > 0 && !done;
  const setTarget = exercise.sets[0];
  const prescription = setTarget?.duration ? `${setTarget.duration} duracao` : `${setTarget?.reps ?? '-'} reps`;

  return (
    <Pressable
      accessibilityRole="button"
      className="flex-row items-center border-b border-border-subtle px-4 py-4"
      onPress={onPress}
      style={{ minHeight: 120 }}
    >
      <ExerciseVisual muscle={exercise.muscle} muted={partial || done} />
      <View className="ml-4 flex-1">
        <AppText className={cn('text-2xl font-medium leading-tight text-text-main', done && 'text-text-muted')}>
          {exercise.name}
        </AppText>
        <AppText className="mt-2 text-base text-text-muted">
          {exercise.sets.length} series, {prescription}{setTarget?.weight ? `, ${setTarget.weight}` : ''}
        </AppText>
        {completedSets > 0 ? (
          <AppText className="mt-4 text-base text-text-muted">
            Series anotadas: {completedSets}/{exercise.sets.length}
          </AppText>
        ) : null}
      </View>

      <View className="ml-3 self-stretch items-center justify-center">
        {done || partial ? <View className={cn('w-1.5 flex-1 rounded-full', done ? 'bg-brand-primary' : 'bg-amber-400')} /> : null}
        {!done && !partial && onPress ? (
          <CaretRight color={isDark ? '#6B7280' : '#9CA3AF'} size={22} weight="bold" />
        ) : null}
      </View>
    </Pressable>
  );
}
