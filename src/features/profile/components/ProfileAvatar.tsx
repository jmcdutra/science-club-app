import { Camera } from 'phosphor-react-native';
import { Pressable, View } from 'react-native';

import { AppText } from '@/src/shared/components/ui/AppText';
import { cn } from '@/src/shared/utils/cn';

const avatarPalettes = [
  'bg-brand-primary',
  'bg-cyan-400',
  'bg-emerald-400',
  'bg-amber-300',
];

type ProfileAvatarProps = {
  name: string;
  variant: number;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
  onPress?: () => void;
};

export function ProfileAvatar({ name, variant, size = 'lg', editable, onPress }: ProfileAvatarProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
  const colorClass = avatarPalettes[(variant - 1) % avatarPalettes.length] ?? avatarPalettes[0];

  const containerSize = size === 'sm' ? 'h-12 w-12' : size === 'md' ? 'h-20 w-20' : 'h-28 w-28';
  const outerRadius = size === 'sm' ? 'rounded-2xl' : size === 'md' ? 'rounded-[24px]' : 'rounded-[32px]';
  const innerRadius = size === 'sm' ? 'rounded-xl' : size === 'md' ? 'rounded-[20px]' : 'rounded-[28px]';
  const textSize = size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : 'text-4xl';

  return (
    <Pressable
      accessibilityRole={editable ? 'button' : undefined}
      disabled={!editable}
      className={cn(
        'relative items-center justify-center border border-white/10 bg-bg-surface p-1',
        containerSize,
        outerRadius,
      )}
      onPress={onPress}
    >
      <View className={cn('h-full w-full items-center justify-center', colorClass, innerRadius)}>
        <View className={cn('absolute inset-0 bg-black/10', innerRadius)} />
        <AppText className={cn('font-semibold text-white', textSize)}>{initials}</AppText>
      </View>
      {editable && size !== 'sm' && (
        <View className="absolute -bottom-2 -right-2 h-11 w-11 items-center justify-center rounded-2xl border border-border-subtle bg-bg-base">
          <Camera color="#A78BFA" size={20} weight="duotone" />
        </View>
      )}
    </Pressable>
  );
}
