import { ArrowRight } from "phosphor-react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/src/shared/components/ui/AppButton";
import { AppLottie } from "@/src/shared/components/ui/AppLottie";
import { AppText } from "@/src/shared/components/ui/AppText";
import { useAppTheme } from "@/src/shared/theme/appTheme";

type EmptyPlanStateProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: {
    label: string;
    onPress: () => void;
  } | null;
};

export function EmptyPlanState({
  eyebrow,
  title,
  subtitle,
  action,
}: EmptyPlanStateProps) {
  const { isDark } = useAppTheme();
  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#000000" : "#FFFFFF" }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
        >
          <Animated.View
            entering={FadeInUp.delay(0).duration(600)}
            style={{ marginBottom: 32, width: "100%", alignItems: "center" }}
          >
            <AppLottie
              source={require("../../../../assets/animations/diet-list.json")}
              size={220}
              loop
              autoPlay
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(120).duration(500)}
            style={{ alignItems: "center" }}
          >
            {/* <AppText
              style={{
                fontSize: 11,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: 3.5,
                color: '#8B5CF6',
                marginBottom: 12,
              }}
            >
              {eyebrow}
            </AppText> */}
            <AppText
              className="font-heading"
              style={{
                fontSize: 28,
                fontWeight: "700",
                letterSpacing: -0.5,
                color: isDark ? "#FFFFFF" : "#111827",
                textAlign: "center",
                marginBottom: 10,
                lineHeight: 28,
              }}
            >
              {title}
            </AppText>
            <AppText
              style={{
                fontSize: 14,
                color: isDark ? "#666666" : "#6B7280",
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              {subtitle}
            </AppText>
          </Animated.View>

          {action && (
            <Animated.View
              entering={FadeInDown.delay(180).duration(500)}
              style={{ marginTop: 24, width: "100%" }}
            >
              <AppButton
                fullWidth
                variant="primary"
                onPress={action.onPress}
                rightIcon={
                  <ArrowRight size={16} color="#FFFFFF" weight="bold" />
                }
              >
                <AppText
                  style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "600" }}
                >
                  {action.label}
                </AppText>
              </AppButton>
            </Animated.View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
