import { Modal, Pressable, View } from "react-native";
import { ClipboardText, LockSimple } from "phosphor-react-native";

import { AppButton } from "@/src/shared/components/ui/AppButton";
import { AppText } from "@/src/shared/components/ui/AppText";

type PendingFormAccessModalProps = {
  description?: string;
  onSubmit: () => void;
  questionnaireTitle?: string;
  visible: boolean;
};

export function PendingFormAccessModal({
  description,
  onSubmit,
  questionnaireTitle,
  visible,
}: PendingFormAccessModalProps) {
  return (
    <Modal animationType="fade" onRequestClose={() => null} transparent visible={visible}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.82)",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 360,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
            backgroundColor: "#0B0B0F",
            paddingHorizontal: 22,
            paddingVertical: 22,
          }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(139,92,246,0.16)",
              marginBottom: 16,
            }}
          >
            <LockSimple color="#A78BFA" size={24} weight="fill" />
          </View>

          <AppText className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-secondary">
            Acesso restrito
          </AppText>
          <AppText
            className="mt-3 font-heading text-[24px] font-bold text-white"
            style={{ letterSpacing: -0.6, lineHeight: 28 }}
          >
            Resposta obrigatória pendente
          </AppText>
          <AppText className="mt-3 text-[14px] leading-6 text-white/68">
            {description ||
              "Seu acesso está temporariamente bloqueado até o envio da avaliação solicitada pela equipe."}
          </AppText>

          {questionnaireTitle ? (
            <View
              style={{
                marginTop: 16,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
                backgroundColor: "rgba(255,255,255,0.04)",
                paddingHorizontal: 14,
                paddingVertical: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <ClipboardText color="#A78BFA" size={18} weight="duotone" />
              <View style={{ flex: 1 }}>
                <AppText className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/38">
                  Questionário
                </AppText>
                <AppText className="mt-1 text-[13px] font-semibold text-white">
                  {questionnaireTitle}
                </AppText>
              </View>
            </View>
          ) : null}

          <View style={{ marginTop: 20 }}>
            <AppButton onPress={onSubmit}>Responder avaliação</AppButton>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onSubmit}
            style={{ marginTop: 14, alignItems: "center", justifyContent: "center" }}
          >
            <AppText className="text-[12px] font-medium text-white/42">
              Abrir agora
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
