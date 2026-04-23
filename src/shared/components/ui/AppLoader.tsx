import { Image } from 'expo-image';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from './AppText';

const logoSource = require('../../../../assets/images/brand/logo_w.png');

type AppLoaderProps = {
  fullScreen?: boolean;
  label?: string;
};

export function AppLoader({ fullScreen, label }: AppLoaderProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.74);
  const translateY = useSharedValue(18);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }),
      withDelay(620, withTiming(0, { duration: 420, easing: Easing.in(Easing.cubic) })),
    );
    scale.value = withSequence(
      withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic) }),
      withDelay(460, withTiming(1.14, { duration: 420, easing: Easing.in(Easing.cubic) })),
    );
    translateY.value = withTiming(0, { duration: 620, easing: Easing.out(Easing.cubic) });
  }, [opacity, scale, translateY]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <View
      className={fullScreen ? 'flex-1 items-center justify-center bg-bg-base px-8' : 'items-center justify-center p-6'}
    >
      <Animated.View className="items-center justify-center" style={logoStyle}>
        <Image
          accessibilityLabel="Science Club"
          contentFit="contain"
          source={logoSource}
          style={{ height: fullScreen ? 260 : 132, width: fullScreen ? 112 : 58 }}
        />
      </Animated.View>
      {label ? (
        <AppText variant="caption" className="mt-6 text-center">
          {label}
        </AppText>
      ) : null}
    </View>
  );
}
