import { memo } from 'react';
import { CheckCircle, CaretRight } from 'phosphor-react-native';
import { Pressable, View } from 'react-native';

import { AppText } from '@/src/shared/components/ui/AppText';
import { cn } from '@/src/shared/utils/cn';

import type { WorkoutExercise } from '../data/workoutSheets';

const MUSCLE_COLOR: Record<string, string> = {
  Abdomen: '#8B5CF6', Core: '#8B5CF6',
  Quadriceps: '#F59E0B', Pernas: '#F59E0B',
  Dorsais: '#38BDF8', Biceps: '#A78BFA',
  Triceps: '#C084FC', Peitoral: '#FF6B9A',
  Posterior: '#FFB86B', Ombros: '#7DD3FC',
  Gluteos: '#FB7185', Panturrilhas: '#FCD34D',
};

type WorkoutExerciseListItemProps = {
  exercise: WorkoutExercise;
  completedSets?: number;
  isDark: boolean;
  onPress?: () => void;
};

function WorkoutExerciseListItemComponent({
  exercise,
  completedSets = 0,
  isDark,
  onPress,
}: WorkoutExerciseListItemProps) {
  const done = completedSets >= exercise.sets.length;
  const partial = completedSets > 0 && !done;
  const setTarget = exercise.sets[0];
  const prescription = setTarget?.duration ?? `${setTarget?.reps ?? '-'} reps`;
  const muscleAccent = MUSCLE_COLOR[exercise.muscle] ?? '#8B5CF6';

  return (
    <Pressable
      accessibilityRole="button"
      className="flex-row items-center py-4"
      style={{ borderBottomWidth: 1, borderBottomColor: isDark ? '#1C1C1C' : '#F0F0F0' }}
      onPress={onPress}
    >
      {/* Muscle color accent bar */}
      <View
        className="mr-4 rounded-full flex-shrink-0"
        style={{
          width: 3,
          alignSelf: 'stretch',
          backgroundColor: done ? (isDark ? '#252525' : '#E0E0E0') : muscleAccent,
        }}
      />

      {/* Content */}
      <View className="flex-1">
        <AppText
          className={cn(
            'text-[15px] font-bold leading-snug',
            done ? 'text-text-muted line-through' : 'text-text-main',
          )}
        >
          {exercise.name}
        </AppText>
        <AppText className="mt-0.5 text-sm text-text-muted">
          {exercise.sets.length}×{prescription}
          {setTarget?.weight ? ` · ${setTarget.weight}` : ''}
        </AppText>
      </View>

      {/* Right side */}
      {partial && (
        <View
          className="rounded-full px-2.5 py-1 mr-3"
          style={{ backgroundColor: `${muscleAccent}18` }}
        >
          <AppText className="text-xs font-bold" style={{ color: muscleAccent }}>
            {completedSets}/{exercise.sets.length}
          </AppText>
        </View>
      )}
      {done && <CheckCircle color={muscleAccent} size={18} weight="bold" />}
      {!done && !partial && onPress && (
        <CaretRight color={isDark ? '#3A3A3A' : '#C8C8C8'} size={15} weight="bold" />
      )}
    </Pressable>
  );
}

export const WorkoutExerciseListItem = memo(
  WorkoutExerciseListItemComponent,
  (prev, next) =>
    prev.exercise === next.exercise &&
    prev.completedSets === next.completedSets &&
    prev.isDark === next.isDark,
);
