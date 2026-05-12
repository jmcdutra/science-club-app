import { ArrowLeft, HardDrives, Moon, Trash } from "phosphor-react-native";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import { AppText } from "@/src/shared/components/ui/AppText";
import { useAppTheme } from "@/src/shared/theme/appTheme";

export function ProfileAppSettingsScreen() {
  const { isDark } = useAppTheme();
  const [darkMode, setDarkMode] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

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
            Configurações do App
          </AppText>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(420)}>
            <AppText
              style={{
                fontSize: 14,
                color: isDark ? "#888888" : "#6B7280",
                marginBottom: 32,
                lineHeight: 22,
              }}
            >
              Ajuste as preferências de uso do aplicativo Science Club no seu
              dispositivo.
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
              {/* Tema Switch */}
              <View
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
                  <Moon color="#A78BFA" size={20} weight="fill" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <AppText
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: isDark ? "#FFFFFF" : "#111827",
                    }}
                  >
                    Modo Escuro
                  </AppText>
                  <AppText
                    style={{
                      fontSize: 13,
                      color: isDark ? "#888888" : "#6B7280",
                      marginTop: 2,
                    }}
                  >
                    Tema visual do aplicativo
                  </AppText>
                </View>
                <Switch
                  ios_backgroundColor="#222222"
                  thumbColor="#FFFFFF"
                  trackColor={{ false: "#222222", true: "#8B5CF6" }}
                  value={darkMode}
                  onValueChange={setDarkMode}
                />
              </View>

              {/* Offline Switch */}
              <View
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
                  <HardDrives color="#38BDF8" size={20} weight="fill" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <AppText
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: isDark ? "#FFFFFF" : "#111827",
                    }}
                  >
                    Modo Offline
                  </AppText>
                  <AppText
                    style={{
                      fontSize: 13,
                      color: isDark ? "#888888" : "#6B7280",
                      marginTop: 2,
                    }}
                  >
                    Baixar treinos automaticamente
                  </AppText>
                </View>
                <Switch
                  ios_backgroundColor="#222222"
                  thumbColor="#FFFFFF"
                  trackColor={{ false: "#222222", true: "#8B5CF6" }}
                  value={offlineMode}
                  onValueChange={setOfflineMode}
                />
              </View>

              {/* Limpar Cache Action */}
              <Pressable
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                }}
                onPress={() => {
                  Alert.alert(
                    "Limpar cache",
                    "Deseja apagar os vídeos e imagens armazenados localmente?",
                    [
                      { text: "Cancelar", style: "cancel" },
                      { text: "Limpar", style: "destructive" },
                    ],
                  );
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: "rgba(239,68,68,0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Trash color="#EF4444" size={20} weight="fill" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <AppText
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: "#EF4444",
                    }}
                  >
                    Limpar cache local
                  </AppText>
                  <AppText
                    style={{
                      fontSize: 13,
                      color: isDark ? "#888888" : "#6B7280",
                      marginTop: 2,
                    }}
                  >
                    Libera espaço no dispositivo
                  </AppText>
                </View>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
