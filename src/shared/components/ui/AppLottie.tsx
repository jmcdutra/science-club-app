import { forwardRef, type ComponentProps } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

type LottieSource = ComponentProps<typeof LottieView>['source'];

type AppLottieProps = Omit<ComponentProps<typeof LottieView>, 'source' | 'style'> & {
  source: LottieSource;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export const AppLottie = forwardRef<LottieView, AppLottieProps>(function AppLottie(
  { size, style, autoPlay = true, loop = true, ...props },
  ref,
) {
  return (
    <LottieView
      ref={ref}
      autoPlay={autoPlay}
      loop={loop}
      style={[size ? { width: size, height: size, alignSelf: 'center' } : styles.fill, style]}
      {...props}
    />
  );
});

const styles = StyleSheet.create({
  fill: {
    width: '100%',
    height: '100%',
    alignSelf: 'center',
  },
});
