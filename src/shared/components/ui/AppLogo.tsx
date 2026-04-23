import { Image } from 'expo-image';
import { View } from 'react-native';

import { AppText } from './AppText';

const logoSource = require('../../../../assets/images/brand/logo_w.png');
const logoHorizontalSource = require('../../../../assets/images/brand/logo_horizontal.png');

type AppLogoProps = {
  compact?: boolean;
  horizontal?: boolean;
};

export function AppLogo({ compact, horizontal }: AppLogoProps) {
  if (horizontal) {
    return (
      <Image
        accessibilityLabel="Science Club"
        contentFit="contain"
        source={logoHorizontalSource}
        style={{ height: 42, width: 132 }}
      />
    );
  }

  return (
    <View className="flex-row items-center gap-3">
      <Image accessibilityLabel="Science Club" contentFit="contain" source={logoSource} style={{ height: 42, width: 18 }} />
      {!compact ? (
        <View>
          <AppText className="font-heading text-xl font-semibold text-text-main">Science Club</AppText>
          <AppText variant="caption" className="text-xs">
            Science Fitness
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
