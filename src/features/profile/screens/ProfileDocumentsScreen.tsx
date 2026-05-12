import {
  ArrowLeft,
  CreditCard,
  DownloadSimple,
  FileText,
  Paperclip,
  ShieldCheck,
  WarningCircle,
} from "phosphor-react-native";
import { router } from "expo-router";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import { AppText } from "@/src/shared/components/ui/AppText";
import { useAppTheme } from "@/src/shared/theme/appTheme";
import { useProfileStore } from "../services/profile.store";
import { ProfileDocument } from "../types";
import { getDocumentCategory, getDocumentStatus } from "../utils";

export function ProfileDocumentsScreen() {
  const { isDark } = useAppTheme();
  const profile = useProfileStore((state) => state.profile);

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
            Meus Documentos
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
                marginBottom: 24,
                lineHeight: 22,
              }}
            >
              Contratos, planos alimentares, planilhas de treino e termos de
              responsabilidade.
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
              }}
            >
              {profile.documents.map((document, index) => {
                const isLast = index === profile.documents.length - 1;
                return (
                  <DocumentRow
                    key={document.id}
                    document={document}
                    last={isLast}
                  />
                );
              })}
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function DocumentRow({
  document,
  last,
}: {
  document: ProfileDocument;
  last?: boolean;
}) {
  const { isDark } = useAppTheme();
  const Icon =
    document.category === "contract"
      ? CreditCard
      : document.category === "exam"
        ? Paperclip
        : document.category === "terms"
          ? ShieldCheck
          : FileText;

  const statusColor =
    document.status === "pending"
      ? "#FBBF24"
      : document.status === "available"
        ? "#A78BFA"
        : "#34D399";
  const statusLabel = getDocumentStatus(document);
  const categoryLabel = getDocumentCategory(document);

  return (
    <>
      <Pressable
        style={{ padding: 16, flexDirection: "row", alignItems: "center" }}
        onPress={() => Alert.alert(document.title, "Download em breve.")}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: "rgba(139,92,246,0.12)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon color="#8B5CF6" size={20} weight="fill" />
        </View>

        <View style={{ flex: 1, marginLeft: 14 }}>
          <AppText
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: isDark ? "#FFFFFF" : "#111827",
            }}
          >
            {document.title}
          </AppText>
          <AppText
            style={{
              fontSize: 13,
              color: isDark ? "#888888" : "#6B7280",
              marginTop: 2,
            }}
          >
            {categoryLabel}
          </AppText>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              backgroundColor: `${statusColor}18`,
              borderRadius: 99,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <AppText
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: statusColor,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              {statusLabel}
            </AppText>
          </View>
          {document.status === "pending" ? (
            <WarningCircle color="#FBBF24" size={18} weight="fill" />
          ) : (
            <DownloadSimple
              color={isDark ? "#666666" : "#94A3B8"}
              size={18}
              weight="bold"
            />
          )}
        </View>
      </Pressable>
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
