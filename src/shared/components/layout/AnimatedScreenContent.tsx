import { useFocusEffect } from '@react-navigation/native';
import { PropsWithChildren, useCallback } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export function AnimatedScreenContent({ children }: PropsWithChildren) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  useFocusEffect(
    useCallback(() => {
      opacity.value = 0;
      translateY.value = 14;

    opacity.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
    }, [opacity, translateY]),
  );

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}
