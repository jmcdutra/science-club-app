import {
  Bell,
  Camera,
  CaretRight,
  Gear,
  Info,
  SignOut,
  Star,
  Tote,
  User,
} from "phosphor-react-native";
import { router } from "expo-router";
import { Alert, Pressable, ScrollView, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useAuthStore } from "@/src/features/auth/services/auth.store";
import { AppText } from "@/src/shared/components/ui/AppText";
import { useAppTheme } from "@/src/shared/theme/appTheme";
import { useProfileStore } from "../services/profile.store";

/* ─── Components ─────────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: string }) {
  const { isDark } = useAppTheme();
  return (
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
      {children}
    </AppText>
  );
}

function SectionContainer({ children }: { children: React.ReactNode }) {
  const { isDark } = useAppTheme();
  return (
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
      {children}
    </View>
  );
}

function RowItem({
  icon,
  iconBg,
  title,
  subtitle,
  trailing,
  onPress,
  showDivider = true,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  showDivider?: boolean;
}) {
  const { isDark } = useAppTheme();
  return (
    <>
      <Pressable
        onPress={onPress}
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
            backgroundColor: iconBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
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
        {trailing ? (
          trailing
        ) : (
          <CaretRight
            size={16}
            color={isDark ? "#444444" : "#94A3B8"}
            weight="bold"
          />
        )}
      </Pressable>
      {showDivider && (
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

/* ─── Screen ─────────────────────────────────────────────────────────────── */

export function ProfileDashboardScreen() {
  const { isDark } = useAppTheme();
  const profile = useProfileStore((state) => state.profile);
  const clearSession = useAuthStore((state) => state.clearSession);

  const handleSignOut = () => {
    Alert.alert("Sair da conta", "Deseja encerrar sua sessão neste aparelho?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await clearSession();
          router.replace("/(public)/login");
        },
      },
    ]);
  };

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#000000" : "#FFFFFF" }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 20 }}
        >
          {/* Top Card */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
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
              {/* Subtle ambient light */}
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: -60,
                  left: 20,
                  width: 140,
                  height: 140,
                  borderRadius: 70,
                  backgroundColor: "rgba(139,92,246,0.15)",
                  transform: [{ scale: 1.5 }],
                }}
              />

              <View style={{ padding: 32, alignItems: "center" }}>
                <Pressable
                  onPress={() =>
                    Alert.alert("Avatar", "Em breve: Alterar foto de perfil")
                  }
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 99,
                    backgroundColor: "#8B5CF6",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <AppText
                    className="font-heading"
                    style={{
                      fontSize: 28,
                      fontWeight: "700",
                      color: isDark ? "#FFFFFF" : "#111827",
                    }}
                  >
                    {initials}
                  </AppText>

                  {/* Camera overlay */}
                  <View
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: -4,
                      backgroundColor: isDark ? "#111111" : "#F9FAFB",
                      borderRadius: 99,
                      padding: 4,
                      borderWidth: 2,
                      borderColor: isDark ? "#111111" : "#F9FAFB",
                    }}
                  >
                    <Camera
                      size={14}
                      color={isDark ? "#FFFFFF" : "#111827"}
                      weight="fill"
                    />
                  </View>
                </Pressable>

                <AppText
                  className="font-heading"
                  style={{
                    fontSize: 22,
                    fontWeight: "700",
                    color: isDark ? "#FFFFFF" : "#111827",
                    marginBottom: 4,
                  }}
                >
                  {profile.name}
                </AppText>
                <AppText
                  style={{
                    fontSize: 14,
                    color: isDark ? "#888888" : "#6B7280",
                  }}
                >
                  {profile.email}
                </AppText>
              </View>

              {/* Stats Divider */}
              <View
                style={{
                  height: 1,
                  backgroundColor: isDark ? "#222222" : "#E5E7EB",
                  marginHorizontal: 24,
                }}
              />

              {/* Stats Bottom Area */}
              <View
                style={{
                  flexDirection: "row",
                  paddingVertical: 20,
                  paddingHorizontal: 24,
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ alignItems: "center", flex: 1 }}>
                  <AppText
                    className="font-heading"
                    style={{
                      fontSize: 20,
                      fontWeight: "700",
                      color: isDark ? "#FFFFFF" : "#111827",
                    }}
                  >
                    {profile.metrics.workoutsDone}
                  </AppText>
                  <AppText
                    style={{
                      fontSize: 10,
                      fontWeight: "600",
                      color: isDark ? "#666666" : "#94A3B8",
                      letterSpacing: 1,
                      marginTop: 4,
                    }}
                  >
                    TREINOS
                  </AppText>
                </View>

                <View
                  style={{
                    width: 1,
                    height: 32,
                    backgroundColor: isDark ? "#222222" : "#E5E7EB",
                  }}
                />

                <View style={{ alignItems: "center", flex: 1 }}>
                  <AppText
                    className="font-heading"
                    style={{
                      fontSize: 20,
                      fontWeight: "700",
                      color: isDark ? "#FFFFFF" : "#111827",
                    }}
                  >
                    28
                  </AppText>
                  <AppText
                    style={{
                      fontSize: 10,
                      fontWeight: "600",
                      color: isDark ? "#666666" : "#94A3B8",
                      letterSpacing: 1,
                      marginTop: 4,
                    }}
                  >
                    SEMANAS
                  </AppText>
                </View>

                <View
                  style={{
                    width: 1,
                    height: 32,
                    backgroundColor: isDark ? "#222222" : "#E5E7EB",
                  }}
                />

                <View style={{ alignItems: "center", flex: 1 }}>
                  <AppText
                    className="font-heading"
                    style={{
                      fontSize: 20,
                      fontWeight: "700",
                      color: isDark ? "#FFFFFF" : "#111827",
                    }}
                  >
                    {profile.metrics.adherence}%
                  </AppText>
                  <AppText
                    style={{
                      fontSize: 10,
                      fontWeight: "600",
                      color: isDark ? "#666666" : "#94A3B8",
                      letterSpacing: 1,
                      marginTop: 4,
                    }}
                  >
                    ADERÊNCIA
                  </AppText>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* CONTA */}
          <Animated.View entering={FadeInDown.delay(150).duration(500)}>
            <SectionLabel>CONTA</SectionLabel>
            <SectionContainer>
              <RowItem
                icon={<User size={20} color="#A78BFA" weight="fill" />}
                iconBg="rgba(139,92,246,0.12)"
                title="Dados pessoais"
                subtitle="Nome, CPF, telefone"
                onPress={() =>
                  router.push("/(app)/profile/edit-contact" as any)
                }
              />
              <RowItem
                icon={<Info size={20} color="#38BDF8" weight="fill" />}
                iconBg="rgba(14,165,233,0.12)"
                title="Meus documentos"
                subtitle="Contratos, exames e termos"
                onPress={() => router.push("/(app)/profile/documents" as any)}
              />
              <RowItem
                icon={<Tote size={20} color="#FBBF24" weight="fill" />}
                iconBg="rgba(234,179,8,0.12)"
                title="Medidas corporais"
                subtitle="Peso, altura, biometria"
                showDivider={false}
                onPress={() =>
                  router.push("/(app)/profile/measurements" as any)
                }
              />
            </SectionContainer>
          </Animated.View>

          {/* PREFERÊNCIAS */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <SectionLabel>PREFERÊNCIAS</SectionLabel>
            <SectionContainer>
              <RowItem
                icon={<Bell size={20} color="#FBBF24" weight="fill" />}
                iconBg="rgba(234,179,8,0.12)"
                title="Notificações"
                subtitle="Ativadas"
                onPress={() => router.push("/(app)/profile/preferences" as any)}
                trailing={
                  <Switch
                    value={true}
                    onValueChange={() => {}}
                    trackColor={{ false: "#222222", true: "#8B5CF6" }}
                    thumbColor={"#FFFFFF"}
                    ios_backgroundColor="#222222"
                  />
                }
              />
              <RowItem
                icon={<Gear size={20} color="#A78BFA" weight="fill" />}
                iconBg="rgba(139,92,246,0.12)"
                title="Configurações do App"
                subtitle="Tema, idioma e cache"
                showDivider={false}
                onPress={() =>
                  router.push("/(app)/profile/app-settings" as any)
                }
              />
            </SectionContainer>
          </Animated.View>

          {/* SUPORTE */}
          <Animated.View entering={FadeInDown.delay(250).duration(500)}>
            <SectionLabel>SUPORTE</SectionLabel>
            <SectionContainer>
              <RowItem
                icon={<Info size={20} color="#38BDF8" weight="fill" />}
                iconBg="rgba(14,165,233,0.12)"
                title="Sobre o app"
                subtitle="v2.4.1 — Science Club"
                onPress={() => router.push("/(app)/profile/about" as any)}
              />
              <RowItem
                icon={<Star size={20} color="#FBBF24" weight="fill" />}
                iconBg="rgba(234,179,8,0.12)"
                title="Avaliar o app"
                subtitle="Deixe sua opinião"
                showDivider={false}
                onPress={() =>
                  Alert.alert(
                    "Em breve",
                    "A avaliação nas lojas de aplicativos estará disponível na versão final.",
                  )
                }
              />
            </SectionContainer>
          </Animated.View>

          {/* Sair Button */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <Pressable
              onPress={handleSignOut}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 18,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: "rgba(239,68,68,0.2)",
                backgroundColor: "rgba(239,68,68,0.05)",
                marginTop: 8,
              }}
            >
              <SignOut size={18} color="#EF4444" weight="bold" />
              <AppText
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: "#EF4444",
                  marginLeft: 8,
                }}
              >
                Sair da conta
              </AppText>
            </Pressable>

            <AppText
              style={{
                fontSize: 12,
                color: "#444444",
                textAlign: "center",
                marginTop: 32,
              }}
            >
              Science Fitness v2.4.1
            </AppText>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
