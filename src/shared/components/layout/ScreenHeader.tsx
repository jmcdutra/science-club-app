import { type ReactNode } from "react";
import { View } from "react-native";

import { AppText } from "@/src/shared/components/ui/AppText";
import { useAppTheme } from "@/src/shared/theme/appTheme";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
};

export function ScreenHeader({
  title,
  subtitle,
  rightAction,
}: ScreenHeaderProps) {
  const { isDark } = useAppTheme();
  return (
    <View
      style={{
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 14,
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#222222" : "#E5E7EB",
      }}
    >
      <View style={{ flex: 1, paddingRight: 16 }}>
        {subtitle ? (
          <AppText
            style={{
              fontSize: 12,
              color: isDark ? "#888888" : "#6B7280",
              marginBottom: 4,
            }}
          >
            {subtitle}
          </AppText>
        ) : null}
        <AppText
          className="font-heading text-text-main"
          style={{ fontSize: 22, fontWeight: "600", letterSpacing: -0.5 }}
        >
          {title}
        </AppText>
      </View>
      {rightAction ?? null}
    </View>
  );
}
