import Feather from '@expo/vector-icons/Feather';
import { View } from 'react-native';

import { AppCard } from '@/src/shared/components/ui/AppCard';
import { AppShell } from '@/src/shared/components/layout/AppShell';
import { AppText } from '@/src/shared/components/ui/AppText';
import { colors } from '@/src/shared/theme/tokens';

type FeaturePlaceholderScreenProps = {
  accent: 'primary' | 'secondary' | 'accent';
  icon: keyof typeof Feather.glyphMap;
  metricLabel: string;
  metricValue: string;
  subtitle: string;
  title: string;
};

export function FeaturePlaceholderScreen({
  accent,
  icon,
  metricLabel,
  metricValue,
  subtitle,
  title,
}: FeaturePlaceholderScreenProps) {
  const accentColor = colors.brand[accent];

  return (
    <AppShell greeting="Science Fitness" title={title}>
      <AppCard className="overflow-hidden p-5">
        <View
          className="absolute -right-14 -top-14 h-40 w-40 rounded-full"
          style={{ backgroundColor: `${accentColor}1A` }}
        />
        <View className="mb-10 h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: `${accentColor}1A` }}>
          <Feather color={accentColor} name={icon} size={23} />
        </View>
        <AppText className="font-heading text-3xl font-bold text-text-main">{metricValue}</AppText>
        <AppText className="mb-6 mt-1 text-sm font-semibold text-brand-primary">{metricLabel}</AppText>
        <AppText variant="caption">{subtitle}</AppText>
      </AppCard>
    </AppShell>
  );
}
