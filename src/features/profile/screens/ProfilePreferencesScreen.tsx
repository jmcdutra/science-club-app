import {
  ArrowLeft,
  Bell,
  ChatCircleText,
  EnvelopeSimple,
  LockKey,
  Phone,
} from "phosphor-react-native";
import { router } from "expo-router";
import { Pressable, ScrollView, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import { AppText } from "@/src/shared/components/ui/AppText";
import { useAppTheme } from "@/src/shared/theme/appTheme";
import { useProfileStore } from "../services/profile.store";
import { ProfilePreferences } from "../types";

const channels: {
  label: string;
  value: ProfilePreferences["communicationChannel"];
  icon: typeof Phone;
}[] = [
  { label: "WhatsApp", value: "whatsapp", icon: Phone },
  { label: "Email", value: "email", icon: EnvelopeSimple },
  { label: "App", value: "app", icon: ChatCircleText },
];

export function ProfilePreferencesScreen() {
  const { isDark } = useAppTheme();
  const preferences = useProfileStore((state) => state.profile.preferences);
  const setPreference = useProfileStore((state) => state.setPreference);

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
            Preferências
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
              Controle como o app se comunica com você e gerencie suas
              configurações de privacidade.
            </AppText>
          </Animated.View>

          {/* Notificações */}
          <Animated.View entering={FadeInDown.delay(100).duration(420)}>
            <AppText
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: isDark ? "#666666" : "#94A3B8",
                letterSpacing: 1.5,
                marginBottom: 12,
                marginLeft: 8,
              }}
            >
              NOTIFICAÇÕES
            </AppText>
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
              <ToggleRow
                icon={Bell}
                iconColor="#FBBF24"
                iconBg="rgba(234,179,8,0.12)"
                title="Lembretes de treino"
                subtitle="Avisos sobre seus treinos."
                value={preferences.workoutReminders}
                onValueChange={(v: boolean) =>
                  setPreference("workoutReminders", v)
                }
              />
              <ToggleRow
                icon={Bell}
                iconColor="#38BDF8"
                iconBg="rgba(14,165,233,0.12)"
                title="Lembretes de dieta"
                subtitle="Alertas de refeições e hidratação."
                value={preferences.mealReminders}
                onValueChange={(v: boolean) =>
                  setPreference("mealReminders", v)
                }
              />
              <ToggleRow
                icon={Bell}
                iconColor="#A78BFA"
                iconBg="rgba(139,92,246,0.12)"
                title="Alertas de avaliação"
                subtitle="Prazos para feedbacks e fotos."
                value={preferences.assessmentAlerts}
                onValueChange={(v: boolean) =>
                  setPreference("assessmentAlerts", v)
                }
                last
              />
            </View>
          </Animated.View>

          {/* Privacidade */}
          <Animated.View entering={FadeInDown.delay(150).duration(420)}>
            <AppText
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: isDark ? "#666666" : "#94A3B8",
                letterSpacing: 1.5,
                marginBottom: 12,
                marginLeft: 8,
              }}
            >
              PRIVACIDADE E COMUNICAÇÃO
            </AppText>
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
              <ToggleRow
                icon={LockKey}
                iconColor="#A78BFA"
                iconBg="rgba(139,92,246,0.12)"
                title="Progresso privado"
                subtitle="Manter suas fotos privadas."
                value={preferences.privateProgress}
                onValueChange={(v: boolean) =>
                  setPreference("privateProgress", v)
                }
              />

              {/* Canal Picker */}
              <View style={{ padding: 16 }}>
                <AppText
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: isDark ? "#FFFFFF" : "#111827",
                    marginBottom: 4,
                  }}
                >
                  Canal de Comunicação
                </AppText>
                <AppText
                  style={{
                    fontSize: 13,
                    color: isDark ? "#888888" : "#6B7280",
                    marginBottom: 16,
                  }}
                >
                  Por onde a equipe deve falar com você?
                </AppText>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  {channels.map((ch) => {
                    const Icon = ch.icon;
                    const active =
                      preferences.communicationChannel === ch.value;
                    return (
                      <Pressable
                        key={ch.value}
                        onPress={() =>
                          setPreference("communicationChannel", ch.value)
                        }
                        style={{
                          flex: 1,
                          height: 50,
                          borderRadius: 12,
                          backgroundColor: active
                            ? "#8B5CF6"
                            : isDark
                              ? "#222222"
                              : "#FFFFFF",
                          borderWidth: 1,
                          borderColor: active
                            ? "#8B5CF6"
                            : isDark
                              ? "#222222"
                              : "#E5E7EB",
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "row",
                        }}
                      >
                        <Icon
                          color={
                            active ? "#FFFFFF" : isDark ? "#888888" : "#6B7280"
                          }
                          size={16}
                          weight={active ? "bold" : "regular"}
                        />
                        <AppText
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: active
                              ? "#FFFFFF"
                              : isDark
                                ? "#888888"
                                : "#6B7280",
                            marginLeft: 6,
                          }}
                        >
                          {ch.label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ToggleRow({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  value,
  onValueChange,
  last,
}: any) {
  const { isDark } = useAppTheme();
  return (
    <>
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: iconBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon color={iconColor} size={20} weight="fill" />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <AppText
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: isDark ? "#FFFFFF" : "#111827",
            }}
          >
            {title}
          </AppText>
          <AppText
            style={{
              fontSize: 13,
              color: isDark ? "#888888" : "#6B7280",
              marginTop: 2,
            }}
          >
            {subtitle}
          </AppText>
        </View>
        <Switch
          ios_backgroundColor={isDark ? "#222222" : "#CBD5E1"}
          thumbColor="#FFFFFF"
          trackColor={{
            false: isDark ? "#222222" : "#CBD5E1",
            true: "#8B5CF6",
          }}
          value={value}
          onValueChange={onValueChange}
        />
      </View>
      {!last && (
        <View
          style={{
            height: 1,
            backgroundColor: isDark ? "#222222" : "#E5E7EB",
            marginLeft: 70,
          }}
        />
      )}
    </>
  );
}
