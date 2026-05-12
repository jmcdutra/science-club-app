import {
  Barbell,
  ForkKnife,
  House,
  PersonSimple,
  UserCircle,
} from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect } from "react";

import { AppText } from "@/src/shared/components/ui/AppText";
import { useAppTheme } from "@/src/shared/theme/appTheme";
import { colors } from "@/src/shared/theme/tokens";

const TAB_BAR_HORIZONTAL_PADDING = 8;
const TAB_ITEM_GAP = 8;

const TABS = [
  { name: "home", label: "Início", Icon: House },
  { name: "workouts", label: "Treinos", Icon: Barbell },
  { name: "diet", label: "Dieta", Icon: ForkKnife },
  { name: "assessments", label: "Avaliação", Icon: PersonSimple },
  { name: "profile", label: "Perfil", Icon: UserCircle },
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

  return (
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
      {TABS.map((tab, index) => (
        <TabItem
          key={tab.name}
          tab={tab}
          focused={state.index === index}
          onPress={() => {
            const event = navigation.emit({
              type: "tabPress",
              target: state.routes[index]?.key,
              canPreventDefault: true,
            });
            if (!event.defaultPrevented) {
              navigation.navigate(state.routes[index]!.name);
            }
          }}
        />
      ))}
    </View>
  );
}
