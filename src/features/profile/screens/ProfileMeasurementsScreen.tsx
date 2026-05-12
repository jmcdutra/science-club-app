import { ArrowLeft, CheckCircle, Ruler, Scales } from "phosphor-react-native";
import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import { AppButton } from "@/src/shared/components/ui/AppButton";
import { AppText } from "@/src/shared/components/ui/AppText";
import { useAppTheme } from "@/src/shared/theme/appTheme";

export function ProfileMeasurementsScreen() {
  const { isDark } = useAppTheme();
  const [weight, setWeight] = useState("78.5");
  const [height, setHeight] = useState("175");

  const handleSave = () => {
    router.back();
  };

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
            Medidas Corporais
          </AppText>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
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
                Mantenha suas medidas atualizadas para um melhor acompanhamento
                da sua evolução e ajustes na dieta.
              </AppText>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).duration(420)}>
              <View style={{ marginBottom: 24 }}>
                <AppText
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: isDark ? "#FFFFFF" : "#111827",
                    marginBottom: 8,
                    marginLeft: 4,
                  }}
                >
                  Peso atual (kg)
                </AppText>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: isDark ? "#111111" : "#F9FAFB",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: isDark ? "#222222" : "#E5E7EB",
                    paddingHorizontal: 16,
                    height: 56,
                  }}
                >
                  <Scales color="#FBBF24" size={20} weight="fill" />
                  <TextInput
                    style={{
                      flex: 1,
                      marginLeft: 12,
                      fontSize: 16,
                      color: isDark ? "#FFFFFF" : "#111827",
                      fontFamily: "Inter",
                    }}
                    keyboardType="numeric"
                    placeholder="Ex: 75.5"
                    placeholderTextColor={isDark ? "#555555" : "#9CA3AF"}
                    value={weight}
                    onChangeText={setWeight}
                  />
                </View>
              </View>

              <View style={{ marginBottom: 32 }}>
                <AppText
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: isDark ? "#FFFFFF" : "#111827",
                    marginBottom: 8,
                    marginLeft: 4,
                  }}
                >
                  Altura (cm)
                </AppText>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: isDark ? "#111111" : "#F9FAFB",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: isDark ? "#222222" : "#E5E7EB",
                    paddingHorizontal: 16,
                    height: 56,
                  }}
                >
                  <Ruler color="#38BDF8" size={20} weight="fill" />
                  <TextInput
                    style={{
                      flex: 1,
                      marginLeft: 12,
                      fontSize: 16,
                      color: isDark ? "#FFFFFF" : "#111827",
                      fontFamily: "Inter",
                    }}
                    keyboardType="numeric"
                    placeholder="Ex: 180"
                    placeholderTextColor={isDark ? "#555555" : "#9CA3AF"}
                    value={height}
                    onChangeText={setHeight}
                  />
                </View>
              </View>

              <View style={{ marginTop: 8 }}>
                <AppButton
                  onPress={handleSave}
                  leftIcon={
                    <CheckCircle color="#FFFFFF" size={18} weight="bold" />
                  }
                  fullWidth
                >
                  Salvar Medidas
                </AppButton>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
