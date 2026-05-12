import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function WorkoutNativeBottomSheetBase({
  children,
  visible,
  onVisibleChange,
}: {
  children: ReactNode;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
}) {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const maxSheetHeight = Math.round(screenHeight * 0.86);
  const [mounted, setMounted] = useState(visible);
  const [contentHeight, setContentHeight] = useState(0);
  const closingRef = useRef(false);

  const sheetHeight = Math.min(
    maxSheetHeight,
    contentHeight > 0 ? contentHeight : maxSheetHeight,
  );

  const translateY = useSharedValue(maxSheetHeight);
  const sheetHeightValue = useSharedValue(maxSheetHeight);

  useEffect(() => {
    sheetHeightValue.value = sheetHeight;
  }, [sheetHeight, sheetHeightValue]);

  const finishClose = useCallback(
    (notifyParent: boolean) => {
      closingRef.current = false;
      setMounted(false);
      if (notifyParent) onVisibleChange(false);
    },
    [onVisibleChange],
  );

  const animateClose = useCallback(
    (notifyParent: boolean) => {
      if (closingRef.current) return;
      closingRef.current = true;
      translateY.value = withTiming(
        sheetHeightValue.value,
        { duration: 260, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (finished) {
            runOnJS(finishClose)(notifyParent);
          }
        },
      );
    },
    [finishClose, sheetHeightValue, translateY],
  );

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }

    if (mounted) {
      animateClose(false);
    }
  }, [animateClose, mounted, visible]);

  useEffect(() => {
    if (!mounted || !visible) return;

    closingRef.current = false;
    translateY.value = sheetHeightValue.value;
    translateY.value = withSpring(0, {
      damping: 26,
      stiffness: 280,
      mass: 0.9,
    });
  }, [mounted, sheetHeightValue, translateY, visible]);

  const onContentLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = Math.ceil(event.nativeEvent.layout.height);
    setContentHeight((current) =>
      current === nextHeight ? current : nextHeight,
    );
  }, []);

  const panGesture = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .onUpdate((event) => {
      const nextOffset =
        event.translationY < 0 ? event.translationY * 0.18 : event.translationY;
      translateY.value = Math.max(-24, nextOffset);
    })
    .onEnd((event) => {
      const shouldClose =
        translateY.value > sheetHeightValue.value * 0.22 ||
        event.velocityY > 1000;

      if (shouldClose) {
        runOnJS(animateClose)(true);
        return;
      }

      translateY.value = withSpring(0, {
        damping: 24,
        stiffness: 300,
        mass: 0.9,
      });
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, sheetHeightValue.value], [1, 0]),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!mounted) return null;

  return (
    <Modal
      animationType="none"
      onRequestClose={() => animateClose(true)}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={mounted}
    >
      <View style={styles.root}>
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.backdrop,
            backdropStyle,
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => animateClose(true)}
          />
        </Animated.View>

        <Animated.View style={[styles.sheetOuter, sheetStyle]}>
          <View
            onLayout={onContentLayout}
            style={[
              styles.sheetInner,
              {
                borderTopLeftRadius: 38,
                borderTopRightRadius: 38,
                maxHeight: maxSheetHeight,
                paddingBottom: Math.max(insets.bottom, 10),
              },
            ]}
          >
            <GestureDetector gesture={panGesture}>
              <View style={styles.handleZone}>
                <View style={styles.handle} />
              </View>
            </GestureDetector>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  sheetOuter: {
    justifyContent: "flex-end",
  },
  sheetInner: {
    overflow: "hidden",
    backgroundColor: "#090909",
    shadowColor: "#000000",
    shadowOpacity: 0.32,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: -4 },
  },
  handleZone: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 28,
    zIndex: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
});
