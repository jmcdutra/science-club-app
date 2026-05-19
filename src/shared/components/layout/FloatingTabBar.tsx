import {
  Barbell,
  DotsThree,
  ForkKnife,
  House,
  PersonSimple,
  SneakerMove,
  Trophy,
  UserCircle,
} from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Modal, Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";

import { AppText } from "@/src/shared/components/ui/AppText";
import { useAppTheme } from "@/src/shared/theme/appTheme";
import { colors } from "@/src/shared/theme/tokens";

const TAB_BAR_HORIZONTAL_PADDING = 8;
const TAB_ITEM_GAP = 8;

const TABS = [
  { name: "home", label: "Início", Icon: House },
  { name: "workouts", label: "Treinos", Icon: Barbell },
  { name: "run", label: "Run", Icon: SneakerMove },
  { name: "diet", label: "Dieta", Icon: ForkKnife },
  { name: "more", label: "Mais", Icon: DotsThree },
];

const MORE_ROUTES = [
  {
    name: "ranking",
    label: "Ranking",
    Icon: Trophy,
  },
  {
    name: "assessments",
    label: "Avaliação",
    Icon: PersonSimple,
  },
  {
    name: "profile",
    label: "Perfil",
    Icon: UserCircle,
  },
];

function TabItem({
  tab,
  focused,
  onPress,
}: {
  tab: (typeof TABS)[0];
  focused: boolean;
  onPress: () => void;
}) {
  const { isDark } = useAppTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.08 : 1, {
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
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: TAB_ITEM_GAP / 2,
      }}
    >
      <Animated.View
        style={[
          animStyle,
          {
            width: "100%",
            height: 54,
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            paddingVertical: 8,
            paddingHorizontal: 10,
            borderRadius: 999,
            backgroundColor: focused
              ? "rgba(139, 92, 246, 0.18)"
              : "transparent",
          },
        ]}
      >
        <tab.Icon
          size={22}
          color={
            focused ? colors.brand.secondary : isDark ? "#6B7280" : "#64748B"
          }
          weight={focused ? "fill" : "regular"}
        />
        <AppText
          numberOfLines={1}
          style={{
            width: "100%",
            fontSize: 9,
            fontWeight: "600",
            color: focused
              ? colors.brand.secondary
              : isDark
                ? "#6B7280"
                : "#64748B",
            letterSpacing: 0.1,
            textAlign: "center",
          }}
        >
          {tab.label}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [moreOpen, setMoreOpen] = useState(false);

  const activeRouteName = state.routes[state.index]?.name;
  const moreFocused = moreOpen || MORE_ROUTES.some((item) => item.name === activeRouteName) || activeRouteName === "more";

  const navigateToRoute = (routeName: string) => {
    const route = state.routes.find((item) => item.name === routeName);
    if (!route) return;

    setMoreOpen(false);

    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  return (
    <>
      <Modal
        transparent
        visible={moreOpen}
        animationType="none"
        onRequestClose={() => setMoreOpen(false)}
      >
        <View
          pointerEvents="box-none"
          style={{ flex: 1 }}
        >
          <Pressable
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              top: 0,
              backgroundColor: "transparent",
            }}
            onPress={() => setMoreOpen(false)}
          />

          <View
            style={{
                position: "absolute",
                bottom: insets.bottom + 84,
                right: 18,
            }}
          >
            <View
            style={{
              width: 190,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: isDark ? "#242424" : "#E5E7EB",
              backgroundColor: isDark ? "#0E0E0E" : "#FFFFFF",
              padding: 6,
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 14 },
              shadowOpacity: isDark ? 0.30 : 0.14,
              shadowRadius: 24,
              elevation: 24,
            }}
          >
            {MORE_ROUTES.map((item) => {
              const focused = activeRouteName === item.name;
              return (
                <Pressable
                  key={item.name}
                  onPress={() => {
                    Haptics.selectionAsync();
                    navigateToRoute(item.name);
                  }}
                  style={({ pressed }) => ({
                    height: 48,
                    borderRadius: 14,
                    justifyContent: "center",
                    backgroundColor: focused
                      ? "rgba(139,92,246,0.16)"
                      : pressed
                        ? isDark ? "#171717" : "#F8FAFC"
                        : "transparent",
                    transform: [{ scale: pressed ? 0.99 : 1 }],
                  })}
                >
                  <View
                    style={{
                      height: 48,
                      paddingHorizontal: 10,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "flex-start",
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 10,
                        backgroundColor: focused ? "rgba(139,92,246,0.22)" : isDark ? "#171717" : "#F1F5F9",
                      }}
                    >
                      <item.Icon
                        size={17}
                        color={focused ? colors.brand.secondary : isDark ? "#9CA3AF" : "#475569"}
                        weight={focused ? "fill" : "duotone"}
                      />
                    </View>
                    <Text
                      allowFontScaling={false}
                      numberOfLines={1}
                      style={{
                        flexShrink: 1,
                        color: isDark ? "#FFFFFF" : "#0F172A",
                        fontSize: 14,
                        fontWeight: "700",
                        lineHeight: 18,
                        includeFontPadding: false,
                      }}
                    >
                      {item.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
            </View>
          </View>
        </View>
      </Modal>

      <View
        style={{
          position: "absolute",
          bottom: insets.bottom + 12,
          left: 16,
          right: 16,
          height: 66,
          borderRadius: 999,
          backgroundColor: isDark ? "#0E0E0E" : "rgba(255,255,255,0.96)",
          borderWidth: 1,
          borderColor: isDark ? "#1E1E1E" : "#E5E7EB",
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: TAB_BAR_HORIZONTAL_PADDING,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: isDark ? 0.5 : 0.12,
          shadowRadius: 28,
          elevation: 20,
        }}
      >
        {TABS.map((tab) => (
          <TabItem
            key={tab.name}
            tab={tab}
            focused={tab.name === "more" ? moreFocused : activeRouteName === tab.name}
            onPress={() => {
              if (tab.name === "more") {
                Haptics.selectionAsync();
                setMoreOpen((current) => !current);
                return;
              }
              setMoreOpen(false);
              navigateToRoute(tab.name);
            }}
          />
        ))}
      </View>
    </>
  );
}
