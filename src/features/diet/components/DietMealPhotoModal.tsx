import { Image } from "expo-image";
import { CheckCircle, NotePencil, X } from "phosphor-react-native";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "@/src/shared/components/ui/AppButton";
import { AppText } from "@/src/shared/components/ui/AppText";
import { useAppTheme } from "@/src/shared/theme/appTheme";

type DietMealPhotoModalProps = {
  initialObservation?: string;
  mealName: string;
  onClose: () => void;
  onConfirm: (payload: { observation: string }) => void;
  photoUri: string;
};

export function DietMealPhotoModal({
  initialObservation = "",
  mealName,
  onClose,
  onConfirm,
  photoUri,
}: DietMealPhotoModalProps) {
  const { isDark } = useAppTheme();
  const [observation, setObservation] = useState(initialObservation);

  useEffect(() => {
    setObservation(initialObservation);
  }, [initialObservation, photoUri]);

  return (
    <Modal animationType="fade" transparent visible onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end"
      >
        <Pressable
          className="absolute inset-0 bg-black/70"
          onPress={onClose}
        />

        <View
          style={{
            backgroundColor: isDark ? "#09090B" : "#FFFFFF",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderWidth: 1,
            borderBottomWidth: 0,
            borderColor: isDark ? "#27272A" : "#E4E4E7",
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 24,
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: -16 },
            shadowOpacity: isDark ? 0.36 : 0.14,
            shadowRadius: 28,
            elevation: 28,
          }}
        >
          <View className="mb-4 flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <AppText className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
                Registro de refeição
              </AppText>
              <AppText className="mt-1 font-heading text-[22px] font-bold text-text-main">
                {mealName}
              </AppText>
              <AppText className="mt-2 text-[12px] leading-[18px] text-text-muted">
                Confira a foto, adicione uma observação rápida e confirme o anexo.
              </AppText>
            </View>

            <Pressable
              className="h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-bg-surface"
              onPress={onClose}
            >
              <X color={isDark ? "#A1A1AA" : "#71717A"} size={16} weight="bold" />
            </Pressable>
          </View>

          <View
            style={{
              overflow: "hidden",
              borderRadius: 24,
              borderWidth: 1,
              borderColor: isDark ? "#27272A" : "#E4E4E7",
              backgroundColor: isDark ? "#111111" : "#F5F5F5",
              marginBottom: 16,
            }}
          >
            <Image
              source={{ uri: photoUri }}
              contentFit="cover"
              style={{ width: "100%", height: 280 }}
            />
            <View
              style={{
                position: "absolute",
                left: 12,
                top: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                borderRadius: 999,
                backgroundColor: "rgba(9,9,11,0.74)",
                paddingHorizontal: 10,
                paddingVertical: 7,
              }}
            >
              <CheckCircle color="#22C55E" size={14} weight="fill" />
              <AppText className="text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                Prévia pronta
              </AppText>
            </View>
          </View>

          <View
            style={{
              borderRadius: 22,
              borderWidth: 1,
              borderColor: isDark ? "#27272A" : "#E4E4E7",
              backgroundColor: isDark ? "#101012" : "#FAFAFA",
              padding: 14,
            }}
          >
            <View className="mb-3 flex-row items-center gap-2">
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isDark ? "rgba(167,139,250,0.14)" : "rgba(139,92,246,0.10)",
                }}
              >
                <NotePencil color="#A78BFA" size={15} weight="fill" />
              </View>
              <View className="flex-1">
                <AppText className="text-[12px] font-bold text-text-main">
                  Adicionar observação
                </AppText>
                <AppText className="text-[11px] text-text-muted">
                  Exemplo: refeição fora de casa, adaptação, apetite ou contexto do dia.
                </AppText>
              </View>
            </View>

            <TextInput
              multiline
              placeholder="Escreva uma observação para acompanhar a foto..."
              placeholderTextColor={isDark ? "#52525B" : "#9CA3AF"}
              style={{
                minHeight: 112,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: isDark ? "#27272A" : "#E4E4E7",
                backgroundColor: isDark ? "#09090B" : "#FFFFFF",
                color: isDark ? "#FFFFFF" : "#111827",
                paddingHorizontal: 14,
                paddingVertical: 14,
                textAlignVertical: "top",
              }}
              value={observation}
              onChangeText={setObservation}
            />
          </View>

          <View className="mt-5 flex-row gap-3">
            <AppButton
              fullWidth
              variant="secondary"
              className="flex-1"
              onPress={onClose}
            >
              Cancelar
            </AppButton>
            <AppButton
              fullWidth
              className="flex-1"
              leftIcon={<CheckCircle color="#FFFFFF" size={16} weight="fill" />}
              onPress={() => onConfirm({ observation: observation.trim() })}
            >
              Confirmar anexo
            </AppButton>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
