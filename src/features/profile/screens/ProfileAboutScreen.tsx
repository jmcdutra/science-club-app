import {
  ArrowLeft,
  Globe,
  InstagramLogo,
  BookOpen,
} from "phosphor-react-native";
import { router } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import { AppText } from "@/src/shared/components/ui/AppText";
import { useAppTheme } from "@/src/shared/theme/appTheme";

export function ProfileAboutScreen() {
  const { isDark } = useAppTheme();
  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#000000" : "#FFFFFF" }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 16,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 99,
              backgroundColor: isDark ? "#111111" : "#F9FAFB",
              borderWidth: 1,
              borderColor: isDark ? "#222222" : "#E5E7EB",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeft
              color={isDark ? "#FFFFFF" : "#111827"}
              size={20}
              weight="bold"
            />
          </Pressable>
          <AppText
            className="font-heading"
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: isDark ? "#FFFFFF" : "#111827",
              marginLeft: 16,
            }}
          >
            Sobre o app
          </AppText>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInDown.duration(420)}
            style={{ alignItems: "center", marginVertical: 32 }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                backgroundColor: isDark ? "#111111" : "#F9FAFB",
                borderRadius: 24,
                borderWidth: 1,
                borderColor: isDark ? "#222222" : "#E5E7EB",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <AppText
                className="font-heading"
                style={{ fontSize: 32, color: isDark ? "#FFFFFF" : "#111827" }}
              >
                SC
              </AppText>
            </View>
            <AppText
              className="font-heading"
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: isDark ? "#FFFFFF" : "#111827",
                marginBottom: 4,
              }}
            >
              Science Club
            </AppText>
            <AppText
              style={{ fontSize: 14, color: isDark ? "#888888" : "#6B7280" }}
            >
              Versão 2.4.1
            </AppText>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(420)}>
            <View
              style={{
                backgroundColor: isDark ? "#111111" : "#F9FAFB",
                borderRadius: 24,
                borderWidth: 1,
                borderColor: isDark ? "#222222" : "#E5E7EB",
                overflow: "hidden",
                marginBottom: 32,
              }}
            >
              <Pressable
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? "#222222" : "#E5E7EB",
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: "rgba(167,139,250,0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BookOpen color="#A78BFA" size={20} weight="fill" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <AppText
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: isDark ? "#FFFFFF" : "#111827",
                    }}
                  >
                    Termos de Uso
                  </AppText>
                </View>
              </Pressable>

              <Pressable
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? "#222222" : "#E5E7EB",
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: "rgba(56,189,248,0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BookOpen color="#38BDF8" size={20} weight="fill" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <AppText
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: isDark ? "#FFFFFF" : "#111827",
                    }}
                  >
                    Política de Privacidade
                  </AppText>
                </View>
              </Pressable>

              <Pressable
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? "#222222" : "#E5E7EB",
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: "rgba(236,72,153,0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <InstagramLogo color="#F472B6" size={20} weight="fill" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <AppText
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: isDark ? "#FFFFFF" : "#111827",
                    }}
                  >
                    Instagram
                  </AppText>
                </View>
              </Pressable>

              <Pressable
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: "rgba(251,191,36,0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Globe color="#FBBF24" size={20} weight="fill" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <AppText
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: isDark ? "#FFFFFF" : "#111827",
                    }}
                  >
                    Site Oficial
                  </AppText>
                </View>
              </Pressable>
            </View>
            <AppText
              style={{
                textAlign: "center",
                fontSize: 12,
                color: isDark ? "#444444" : "#94A3B8",
              }}
            >
              Science Club Ltda © 2026{"\n"}Todos os direitos reservados.
            </AppText>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
