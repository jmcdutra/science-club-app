import { CaretRight, CheckCircle, WarningCircle } from 'phosphor-react-native';
import { ComponentType } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/src/shared/components/ui/AppText';
import { cn } from '@/src/shared/utils/cn';

type AssessmentTaskCardProps = {
  title: string;
  description: string;
  progressLabel: string;
  done?: boolean;
  urgent?: boolean;
  neutral?: boolean;
  disabled?: boolean;
  icon: ComponentType<{ color: string; size: number; weight?: 'regular' | 'duotone' | 'fill' | 'bold' }>;
  onPress?: () => void;
};

export function AssessmentTaskCard({
  title,
  description,
  progressLabel,
  done,
  urgent,
  neutral,
  disabled,
  icon: Icon,
  onPress,
}: AssessmentTaskCardProps) {
  const color = done ? '#34D399' : urgent ? '#FCD34D' : neutral ? '#71717A' : '#A78BFA';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      className={cn(
        'flex-row items-center rounded-[24px] border border-border-subtle bg-bg-surface p-4',
        disabled && 'opacity-55',
      )}
      onPress={onPress}
    >
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-bg-base">
        <Icon color={color} size={25} weight="duotone" />
      </View>
      <View className="ml-4 flex-1">
        <View className="flex-row items-center gap-2">
          <AppText className="flex-1 text-base font-bold text-text-main">{title}</AppText>
          {done ? (
            <CheckCircle color="#34D399" size={18} weight="fill" />
          ) : urgent ? (
            <WarningCircle color="#FCD34D" size={18} weight="fill" />
          ) : null}
        </View>
        <AppText className="mt-1 text-sm leading-snug text-text-muted">{description}</AppText>
        <AppText className={cn('mt-2 text-xs font-bold', done ? 'text-emerald-300' : neutral ? 'text-text-muted' : 'text-brand-secondary')}>
          {progressLabel}
        </AppText>
      </View>
      {!disabled && <CaretRight color="#71717A" size={19} weight="bold" />}
    </Pressable>
  );
}
