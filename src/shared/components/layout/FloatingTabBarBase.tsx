import { type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import {
  Barbell,
  ForkKnife,
  House,
  PersonSimple,
  SneakerMove,
  Trophy,
  UserCircle,
} from "phosphor-react-native";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Pressable,
  ScrollView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/src/shared/components/ui/AppText";
import { useAppTheme } from "@/src/shared/theme/appTheme";
import { colors } from "@/src/shared/theme/tokens";

const TAB_BAR_HEIGHT = 76;
const TAB_ITEM_HEIGHT = 58;
const TAB_ITEM_WIDTH = 68;
const TAB_ITEM_GAP = 8;
const TAB_LOOP_COPIES = 3;
const VISIBLE_TAB_COUNT = 4;
const TAB_PEEK_WIDTH = 18;
const TAB_STEP = TAB_ITEM_WIDTH + TAB_ITEM_GAP;
const VISIBLE_TRACK_WIDTH =
  VISIBLE_TAB_COUNT * TAB_ITEM_WIDTH +
  Math.max(0, VISIBLE_TAB_COUNT - 1) * TAB_ITEM_GAP;
const TAB_VIEWPORT_WIDTH = VISIBLE_TRACK_WIDTH + TAB_PEEK_WIDTH * 2;

const TABS = [
  { name: "home", label: "Início", Icon: House },
  { name: "workouts", label: "Treinos", Icon: Barbell },
  { name: "run", label: "Run", Icon: SneakerMove },
  { name: "diet", label: "Dieta", Icon: ForkKnife },
  { name: "assessments", label: "Avaliação", Icon: PersonSimple },
  { name: "ranking", label: "Ranking", Icon: Trophy },
  { name: "profile", label: "Perfil", Icon: UserCircle },
] as const;

const LOOPED_TABS = Array.from({ length: TAB_LOOP_COPIES }, (_, copyIndex) =>
  TABS.map((tab, tabIndex) => ({
    ...tab,
    key: `${copyIndex}-${tab.name}`,
    tabIndex,
  })),
).flat();

type TabConfig = (typeof TABS)[number];

function TabItem({
  tab,
  focused,
  onPress,
  width,
  trailingGap,
}: {
  tab: TabConfig;
  focused: boolean;
  onPress: () => void;
  width: number;
  trailingGap: number;
}) {
  const { isDark } = useAppTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.05 : 1, {
      damping: 18,
      stiffness: 220,
    });
  }, [focused, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={{
        width,
        marginRight: trailingGap,
      }}
    >
      <Animated.View
        style={[
          animStyle,
          {
            width: "100%",
            height: TAB_ITEM_HEIGHT,
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            paddingVertical: 6,
            paddingHorizontal: 8,
          },
        ]}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: focused
              ? "rgba(139, 92, 246, 0.18)"
              : "transparent",
            borderWidth: focused ? 1 : 0,
            borderColor: focused ? "rgba(167, 139, 250, 0.26)" : "transparent",
          }}
        >
          <tab.Icon
            size={19}
            color={
              focused
                ? colors.brand.secondary
                : isDark
                  ? "#6B7280"
                  : "#64748B"
            }
            weight={focused ? "fill" : "regular"}
          />
        </View>
        <AppText
          numberOfLines={1}
          style={{
            width: "100%",
            fontSize: 9,
            fontWeight: "700",
            color: focused
              ? colors.brand.secondary
              : isDark
                ? "#6B7280"
                : "#64748B",
            letterSpacing: 0.15,
            textAlign: "center",
          }}
        >
          {tab.label}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

export function FloatingTabBarBase({
  state,
  navigation,
}: BottomTabBarProps) {
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const initializedRef = useRef(false);
  const currentScrollXRef = useRef(0);

  const activeRouteName = state.routes[state.index]?.name;
  const visibleRouteNames = useMemo(
    () => new Set(state.routes.map((route) => route.name)),
    [state.routes],
  );
  const singleLoopWidth = TABS.length * TAB_STEP;
  const snapOffsets = useMemo(
    () =>
      Array.from({ length: TAB_LOOP_COPIES }, (_, copyIndex) =>
        TABS.map(
          (_, tabIndex) =>
            copyIndex * singleLoopWidth + tabIndex * TAB_STEP - TAB_PEEK_WIDTH,
        ),
      )
        .flat()
        .filter((offset) => offset >= 0),
    [singleLoopWidth],
  );

  const findTabIndex = useCallback(
    (routeName?: string) => TABS.findIndex((tab) => tab.name === routeName),
    [],
  );
  const getBaseOffsetForIndex = useCallback(
    (tabIndex: number) =>
      singleLoopWidth + tabIndex * TAB_STEP - TAB_PEEK_WIDTH,
    [singleLoopWidth],
  );

  const navigateToRoute = useCallback(
    (routeName: string) => {
      const route = state.routes.find((item) => item.name === routeName);
      if (!route) return;

      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });

      if (!event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    },
    [navigation, state.routes],
  );

  const scrollToActiveTab = useCallback(
    (routeName?: string, animated = true) => {
      if (!scrollRef.current) return;

      const tabIndex = findTabIndex(routeName);
      if (tabIndex < 0) return;

      const baseOffset = getBaseOffsetForIndex(tabIndex);
      const currentOffset = currentScrollXRef.current || baseOffset;
      const candidates = [
        baseOffset - singleLoopWidth,
        baseOffset,
        baseOffset + singleLoopWidth,
      ];
      const targetOffset = candidates.reduce((closest, candidate) =>
        Math.abs(candidate - currentOffset) < Math.abs(closest - currentOffset)
          ? candidate
          : closest,
      );

      currentScrollXRef.current = targetOffset;
      scrollRef.current.scrollTo({ x: targetOffset, animated });
    },
    [findTabIndex, getBaseOffsetForIndex, singleLoopWidth],
  );

  const normalizeLoopPosition = useCallback((offsetX: number) => {
    if (!scrollRef.current) return;

    if (offsetX <= singleLoopWidth * 0.5) {
      const nextOffset = offsetX + singleLoopWidth;
      currentScrollXRef.current = nextOffset;
      scrollRef.current.scrollTo({
        x: nextOffset,
        animated: false,
      });
      return;
    }

    if (offsetX >= singleLoopWidth * 1.5) {
      const nextOffset = offsetX - singleLoopWidth;
      currentScrollXRef.current = nextOffset;
      scrollRef.current.scrollTo({
        x: nextOffset,
        animated: false,
      });
    }
  }, [singleLoopWidth]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      currentScrollXRef.current = event.nativeEvent.contentOffset.x;
    },
    [],
  );

  const handleNormalize = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      currentScrollXRef.current = event.nativeEvent.contentOffset.x;
      normalizeLoopPosition(event.nativeEvent.contentOffset.x);
    },
    [normalizeLoopPosition],
  );

  useEffect(() => {
    if (initializedRef.current) return;

    initializedRef.current = true;
    requestAnimationFrame(() => {
      scrollToActiveTab(activeRouteName, false);
    });
  }, [activeRouteName, scrollToActiveTab]);

  useEffect(() => {
    if (!initializedRef.current) return;
    scrollToActiveTab(activeRouteName, true);
  }, [activeRouteName, scrollToActiveTab]);

  return (
    <View
      style={{
        position: "absolute",
        bottom: insets.bottom + 10,
        left: 14,
        right: 14,
        height: TAB_BAR_HEIGHT,
        borderRadius: 999,
        backgroundColor: isDark
          ? "rgba(12, 12, 12, 0.92)"
          : "rgba(255,255,255,0.96)",
        borderWidth: 1,
        borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E5E7EB",
        justifyContent: "center",
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: isDark ? 0.28 : 0.12,
        shadowRadius: 32,
        elevation: 18,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: TAB_VIEWPORT_WIDTH,
          maxWidth: "100%",
          alignSelf: "center",
          overflow: "hidden",
        }}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          bounces={false}
          decelerationRate="fast"
          directionalLockEnabled
          nestedScrollEnabled
          onMomentumScrollEnd={handleNormalize}
          onScroll={handleScroll}
          onScrollEndDrag={handleNormalize}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          snapToAlignment="start"
          snapToOffsets={snapOffsets}
          contentContainerStyle={{
            alignItems: "center",
          }}
        >
          {LOOPED_TABS.map(({ key, ...tab }) => {
            if (!visibleRouteNames.has(tab.name)) {
              return null;
            }

            return (
              <TabItem
                key={key}
                tab={tab}
                focused={activeRouteName === tab.name}
                trailingGap={TAB_ITEM_GAP}
                width={TAB_ITEM_WIDTH}
                onPress={() => navigateToRoute(tab.name)}
              />
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}
