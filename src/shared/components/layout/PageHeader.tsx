import { Bell } from "phosphor-react-native";
import { useMemo } from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { AppText } from "@/src/shared/components/ui/AppText";
import { useAppTheme } from "@/src/shared/theme/appTheme";

const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS_SHORT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  onNotificationPress?: () => void;
};

export function PageHeader({
  title,
  subtitle,
  onNotificationPress,
}: PageHeaderProps) {
  const { isDark } = useAppTheme();
  const dateLabel = useMemo(() => {
    const now = new Date();
    return `${WEEKDAY_SHORT[now.getDay()]}, ${now.getDate()} ${MONTHS_SHORT[now.getMonth()]}`;
  }, []);

  return (
    <Animated.View
      entering={FadeInDown.delay(0).duration(500)}
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 18,
      }}
    >
      <View>
        <AppText
          style={{
            fontSize: 12,
            color: isDark ? "#888888" : "#6B7280",
            marginBottom: 4,
          }}
        >
          {subtitle ?? dateLabel}
        </AppText>
        <AppText
          className="font-heading"
          style={{
            fontSize: 22,
            fontWeight: "600",
            color: isDark ? "#FFFFFF" : "#111827",
            letterSpacing: -0.5,
          }}
        >
          {title}
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Notificações"
        onPress={onNotificationPress}
        style={{
          width: 36,
          height: 36,
          borderRadius: 99,
          backgroundColor: isDark ? "#111111" : "#F9FAFB",
          borderWidth: 1,
          borderColor: isDark ? "#222222" : "#E5E7EB",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Bell size={16} color={isDark ? "#888888" : "#6B7280"} />
      </Pressable>
    </Animated.View>
  );
}
