import { Bell } from "phosphor-react-native";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { AppText } from "@/src/shared/components/ui/AppText";
import { useAppTheme } from "@/src/shared/theme/appTheme";
import { useAuthStore } from "@/src/features/auth/services/auth.store";
import { getMyNotifications } from "@/src/features/notifications/api/notifications";

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
  const { session } = useAuthStore();
  const dateLabel = useMemo(() => {
    const now = new Date();
    return `${WEEKDAY_SHORT[now.getDay()]}, ${now.getDate()} ${MONTHS_SHORT[now.getMonth()]}`;
  }, []);
  const notificationsQuery = useQuery({
    queryKey: ["app-notifications", session?.studentId],
    queryFn: () => getMyNotifications(session?.token!),
    enabled: Boolean(session?.token && onNotificationPress),
    staleTime: 30_000,
  });
  const unreadCount = (notificationsQuery.data ?? []).filter((item) => !item.read).length;

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
        {unreadCount > 0 ? (
          <View
            style={{
              position: "absolute",
              top: -5,
              right: -5,
              minWidth: 18,
              height: 18,
              borderRadius: 99,
              backgroundColor: "#EF4444",
              borderWidth: 2,
              borderColor: isDark ? "#090909" : "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 4,
            }}
          >
            <AppText style={{ fontSize: 10, fontWeight: "800", color: "#FFFFFF" }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </AppText>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}
