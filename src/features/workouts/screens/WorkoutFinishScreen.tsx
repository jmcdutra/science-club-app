import * as ImagePicker from "expo-image-picker";
import Constants from "expo-constants";
import {
  Camera,
  CheckCircle,
  Flame,
  ImageSquare,
  InstagramLogo,
  ShareNetwork,
  TrendUp,
  Clock,
} from "phosphor-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { type ReactNode, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Animated,
  Alert,
  Image,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { captureRef } from "react-native-view-shot";

import { AppButton } from "@/src/shared/components/ui/AppButton";
import { AppCard } from "@/src/shared/components/ui/AppCard";
import { AppLottie } from "@/src/shared/components/ui/AppLottie";
import { AppScreen } from "@/src/shared/components/ui/AppScreen";
import { AppText } from "@/src/shared/components/ui/AppText";
import { useAppTheme } from "@/src/shared/theme/appTheme";
import { useAuthStore } from "@/src/features/auth/services/auth.store";

import { getWorkoutSession } from "../data/workoutSheets";
import { getCurrentWorkout } from "../api/workouts";

function formatSeconds(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDecimal(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

type NativeShareModule = {
  Social?: { INSTAGRAM_STORIES?: string };
  open: (options: Record<string, unknown>) => Promise<unknown>;
  shareSingle: (options: Record<string, unknown>) => Promise<unknown>;
};

type RatingValue = "easy" | "good" | "beast";

const RATING_OPTIONS: {
  value: RatingValue;
  label: string;
  emoji: string;
}[] = [
  { value: "easy", label: "Fácil", emoji: "😴" },
  { value: "good", label: "Deu pra fazer", emoji: "💪" },
  { value: "beast", label: "Muito difícil", emoji: "🔥" },
];

type BurstParticle = {
  dx: number;
  lift: number;
  drift: number;
  rotate: number;
  scale: number;
};

function getNativeShareModule() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const shareModule = require("react-native-share") as {
      default?: NativeShareModule;
    } & NativeShareModule;
    return shareModule.default ?? shareModule;
  } catch {
    return null;
  }
}

function StatTile({
  label,
  value,
  unit,
  icon,
  iconBackground,
  iconColor,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: ReactNode;
  iconBackground: string;
  iconColor: string;
}) {
  return (
    <AppCard className="rounded-[20px] px-4 py-4" style={{ width: "48.6%" }}>
      <View
        className="h-8 w-8 items-center justify-center rounded-full"
        style={{ backgroundColor: iconBackground }}
      >
        {icon}
      </View>
      <AppText className="mt-3 text-[11px] font-medium text-text-muted">
        {label}
      </AppText>
      <AppText className="mt-1 font-sans text-[22px] font-bold leading-none text-text-main">
        {value}
        {unit ? (
          <AppText
            className="text-[11px] font-normal text-text-muted"
            style={{ color: iconColor }}
          >
            {" "}
            {unit}
          </AppText>
        ) : null}
      </AppText>
    </AppCard>
  );
}

export function WorkoutFinishScreen() {
  const { isDark } = useAppTheme();
  const { height: windowHeight } = useWindowDimensions();
  const composedShareRef = useRef<View>(null);
  const overlayStickerRef = useRef<View>(null);
  const celebrationOverlayRef = useRef<View>(null);
  const { id, sessionId, elapsed, sets, totalSets, exercises, progressions } =
    useLocalSearchParams<{
      id: string;
      sessionId?: string;
      elapsed?: string;
      sets?: string;
      totalSets?: string;
      exercises?: string;
      progressions?: string;
    }>();
  const { session: authSession } = useAuthStore();
  const { data: currentWorkoutData } = useQuery({
    queryKey: ["student-workout-current"],
    queryFn: () => getCurrentWorkout(authSession?.token!),
    enabled: !!authSession?.token,
  });
  const remoteWorkout =
    currentWorkoutData?.workout && currentWorkoutData.workout.id === id
      ? currentWorkoutData.workout
      : null;
  const session = remoteWorkout
    ? remoteWorkout.sessions.find((candidate) => candidate.id === sessionId) ||
      remoteWorkout.sessions[0]
    : getWorkoutSession(id, sessionId);
  const sessionExercises = session.exercises.filter(Boolean);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState<RatingValue | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [burstEmoji, setBurstEmoji] = useState<string | null>(null);
  const [burstParticles, setBurstParticles] = useState<BurstParticle[]>([]);
  const [burstOrigin, setBurstOrigin] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const burstProgress = useRef(new Animated.Value(0)).current;

  const elapsedSeconds = Number(elapsed ?? 0);
  const completedSets = Number(sets ?? 0);
  const prescribedSets = Number(totalSets ?? completedSets);
  const completedExercises = Number(exercises ?? sessionExercises.length);
  const progressionCount = Number(progressions ?? 0);
  const instagramStoriesAppId =
    Constants.expoConfig?.extra?.instagramStoriesAppId;

  const estimatedVolumeTons = useMemo(() => {
    const derived =
      completedSets * 1.62 +
      completedExercises * 0.48 +
      progressionCount * 0.35;
    return Math.max(3.2, Number(derived.toFixed(1)));
  }, [completedExercises, completedSets, progressionCount]);

  const prLabels = useMemo(() => {
    if (progressionCount <= 0) return [];
    return sessionExercises
      .slice(0, progressionCount)
      .map((exercise) => exercise.name);
  }, [progressionCount, sessionExercises]);

  const shareText = useMemo(
    () =>
      `${session.title} no Science Club — ${completedSets}/${prescribedSets} séries, ${formatSeconds(elapsedSeconds)}, ${formatDecimal(estimatedVolumeTons)} ton.`,
    [
      completedSets,
      elapsedSeconds,
      estimatedVolumeTons,
      prescribedSets,
      session.title,
    ],
  );

  async function pickCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permissão da câmera",
        "Autorize a câmera para registrar o treino.",
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.88,
    });
    if (!result.canceled) setPhotoUri(result.assets[0]?.uri ?? null);
  }

  async function pickLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permissão de fotos",
        "Autorize a galeria para anexar uma foto.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 5],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.88,
    });
    if (!result.canceled) setPhotoUri(result.assets[0]?.uri ?? null);
  }

  function choosePhoto() {
    Alert.alert("Foto do treino", "Registre uma foto para o histórico.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Galeria", onPress: pickLibrary },
      { text: "Câmera", onPress: pickCamera },
    ]);
  }

  async function captureComposedCard() {
    if (!composedShareRef.current) return null;
    try {
      return await captureRef(composedShareRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
    } catch {
      return null;
    }
  }

  async function captureOverlaySticker() {
    if (!overlayStickerRef.current) return null;
    try {
      return await captureRef(overlayStickerRef, {
        format: "png",
        quality: 1,
        result: "base64",
      });
    } catch {
      return null;
    }
  }

  async function shareInstagramStories() {
    const nativeShare = getNativeShareModule();
    if (!nativeShare) {
      Alert.alert(
        "Build nativa necessária",
        "Compartilhamento direto no Instagram requer build nativa.",
      );
      return;
    }
    const stickerBase64 = await captureOverlaySticker();
    if (!stickerBase64) {
      Alert.alert("Erro", "Não foi possível gerar o overlay.");
      return;
    }
    if (
      !instagramStoriesAppId ||
      instagramStoriesAppId === "REPLACE_WITH_FACEBOOK_APP_ID"
    ) {
      Alert.alert(
        "Facebook App ID ausente",
        "Configure instagramStoriesAppId no app.json.",
      );
      return;
    }
    try {
      await nativeShare.shareSingle({
        appId: instagramStoriesAppId,
        backgroundBottomColor: "#000000",
        backgroundTopColor: "#000000",
        social: nativeShare.Social?.INSTAGRAM_STORIES ?? "instagramstories",
        stickerImage: `data:image/png;base64,${stickerBase64}`,
      });
    } catch {
      Alert.alert("Erro", "Não foi possível abrir o Instagram Stories.");
    }
  }

  async function shareOtherApps() {
    const nativeShare = getNativeShareModule();
    if (!nativeShare) {
      Alert.alert(
        "Build nativa necessária",
        "Compartilhamento com imagem requer build nativa.",
      );
      return;
    }
    const cardUri = await captureComposedCard();
    if (!cardUri) {
      Alert.alert("Erro", "Não foi possível gerar a imagem.");
      return;
    }
    await nativeShare.open({
      failOnCancel: false,
      message: shareText,
      title: "Treino finalizado",
      type: "image/png",
      url: cardUri,
    });
  }

  function saveWorkout() {
    if (submitted) {
      router.replace("/(app)/(tabs)/workouts");
      return;
    }
    setSubmitted(true);
  }

  function buildBurstParticles() {
    return Array.from({ length: 18 }, (_, index) => {
      const ratio = index / 17;
      const side = ratio * 2 - 1;
      return {
        dx: side * (86 + Math.random() * 124),
        lift: 104 + Math.random() * 76,
        drift: -26 + Math.random() * 52,
        rotate: -28 + Math.random() * 56,
        scale: 0.8 + Math.random() * 0.45,
      };
    });
  }

  function triggerEmojiBurst(
    nextEmoji: string,
    nextValue: RatingValue,
    pageX: number,
    pageY: number,
  ) {
    setRating(nextValue);
    celebrationOverlayRef.current?.measureInWindow((x, y) => {
      setBurstOrigin({
        x: pageX - x,
        y: pageY - y,
      });
      setBurstParticles(buildBurstParticles());
      setBurstEmoji(nextEmoji);
      burstProgress.stopAnimation();
      burstProgress.setValue(0);
      Animated.sequence([
        Animated.timing(burstProgress, {
          duration: 1450,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(burstProgress, {
          duration: 80,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setBurstEmoji(null);
          setBurstOrigin(null);
          setBurstParticles([]);
        }
      });
    });
  }

  return (
    <AppScreen hideGlow keyboard scroll={false}>
      <View
        ref={celebrationOverlayRef}
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 30,
        }}
      >
        {burstEmoji && burstOrigin
          ? burstParticles.map((particle, index) => (
              <Animated.Text
                key={`${burstEmoji}-${index}`}
                style={{
                  position: "absolute",
                  left: burstOrigin.x,
                  top: burstOrigin.y,
                  fontSize: 28,
                  opacity: burstProgress.interpolate({
                    inputRange: [0, 0.08, 0.82, 1],
                    outputRange: [0, 1, 1, 0],
                  }),
                  transform: [
                    { translateX: -14 },
                    { translateY: -14 },
                    {
                      translateX: burstProgress.interpolate({
                        inputRange: [0, 0.2, 1],
                        outputRange: [
                          0,
                          particle.dx * 0.42,
                          particle.dx + particle.drift,
                        ],
                      }),
                    },
                    {
                      translateY: burstProgress.interpolate({
                        inputRange: [0, 0.18, 1],
                        outputRange: [
                          0,
                          -particle.lift,
                          windowHeight - burstOrigin.y + 120,
                        ],
                      }),
                    },
                    {
                      rotate: burstProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", `${particle.rotate}deg`],
                      }),
                    },
                    {
                      scale: burstProgress.interpolate({
                        inputRange: [0, 0.12, 1],
                        outputRange: [
                          0.4,
                          particle.scale,
                          particle.scale * 0.9,
                        ],
                      }),
                    },
                  ],
                }}
              >
                {burstEmoji}
              </Animated.Text>
            ))
          : null}
      </View>

      <View
        ref={overlayStickerRef}
        collapsable={false}
        pointerEvents="none"
        style={{
          backgroundColor: "transparent",
          height: 360,
          left: -1000,
          position: "absolute",
          top: 0,
          width: 360,
        }}
      >
        <View className="flex-1 items-center justify-center px-7">
          <AppText className="text-sm font-semibold text-white">
            SCIENCE CLUB
          </AppText>
          <View className="mt-6 flex-row items-center justify-center gap-6">
            <View className="items-center">
              <AppText className="text-3xl font-semibold text-white">
                {completedExercises}
              </AppText>
              <AppText className="text-xs text-white/70">exercícios</AppText>
            </View>
            <View className="items-center rounded-full border border-brand-primary/70 bg-brand-primary/20 px-6 py-4">
              <AppText className="text-4xl font-semibold text-brand-secondary">
                {completedSets}
              </AppText>
              <AppText className="text-xs text-white/70">séries</AppText>
            </View>
            <View className="items-center">
              <AppText className="text-3xl font-semibold text-white">
                {formatDecimal(estimatedVolumeTons)}
              </AppText>
              <AppText className="text-xs text-white/70">toneladas</AppText>
            </View>
          </View>
          <AppText className="mt-6 text-3xl font-semibold text-white">
            {formatSeconds(elapsedSeconds)}
          </AppText>
          <AppText className="mt-5 text-sm font-semibold text-white">
            @scienceclub
          </AppText>
        </View>
      </View>

      <View
        ref={composedShareRef}
        collapsable={false}
        style={{
          backgroundColor: isDark ? "#000000" : "#FFFFFF",
          height: 360,
          left: -1000,
          position: "absolute",
          top: 0,
          width: 360,
        }}
      >
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            resizeMode="cover"
            style={{
              height: "100%",
              opacity: 0.2,
              position: "absolute",
              width: "100%",
            }}
          />
        ) : null}
        <View className="flex-1 items-center justify-center px-7">
          <AppText className="text-sm font-semibold text-text-main">
            SCIENCE CLUB
          </AppText>
          <View className="mt-5 flex-row items-center justify-center gap-8">
            <View className="items-center">
              <AppText className="text-3xl font-semibold text-text-main">
                {completedExercises}
              </AppText>
              <AppText className="text-xs text-text-muted">exercícios</AppText>
            </View>
            <View className="items-center rounded-full border border-brand-primary/50 bg-brand-primary/10 px-7 py-4">
              <AppText className="text-4xl font-semibold text-brand-secondary">
                {completedSets}
              </AppText>
              <AppText className="text-xs text-text-muted">séries</AppText>
            </View>
            <View className="items-center">
              <AppText className="text-3xl font-semibold text-text-main">
                {formatDecimal(estimatedVolumeTons)}
              </AppText>
              <AppText className="text-xs text-text-muted">toneladas</AppText>
            </View>
          </View>
          <AppText className="mt-5 text-3xl font-semibold text-text-main">
            {formatSeconds(elapsedSeconds)}
          </AppText>
          <AppText className="mt-1 text-xs text-text-muted">duração</AppText>
          <AppText className="mt-5 text-sm font-semibold text-text-main">
            @scienceclub
          </AppText>
        </View>
      </View>

      <View className="flex-1">
        <View className="flex-row items-center border-b border-border-subtle px-4 pb-3 pt-3">
          <AppText className="font-heading text-[16px] font-bold text-text-main">
            Resumo do Treino
          </AppText>
          <View className="flex-1" />
          <AppText className="text-[12px] font-semibold text-text-muted">
            {formatSeconds(elapsedSeconds)}
          </AppText>
        </View>

        <ScrollView
          bounces
          contentContainerStyle={{ paddingBottom: 132 }}
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        >
          <View className="border-b border-border-subtle px-6 pb-6 pt-5">
            <View className="items-center">
              <View className="mb-2 h-[132px] w-[132px] items-center justify-center">
                <AppLottie
                  autoPlay
                  loop
                  size={132}
                  source={require("@/assets/animations/Trophy.json")}
                />
              </View>
              <AppText className="font-heading text-[32px] font-bold text-text-main">
                Treino Finalizado!
              </AppText>
              <AppText className="mt-2 text-[14px] text-text-muted">
                {session.title}
              </AppText>
            </View>
          </View>

          <View className="px-5 pt-5">
            <View className="mb-[18px] flex-row flex-wrap justify-between gap-y-3.5">
              <StatTile
                label="Duração"
                value={formatSeconds(elapsedSeconds)}
                icon={<Clock size={14} color="#8B5CF6" weight="bold" />}
                iconBackground="rgba(139,92,246,0.12)"
                iconColor="#8B5CF6"
              />
              <StatTile
                label="Volume"
                value={formatDecimal(estimatedVolumeTons)}
                unit="ton"
                icon={<TrendUp size={14} color="#22C55E" weight="bold" />}
                iconBackground="rgba(34,197,94,0.12)"
                iconColor="#22C55E"
              />
              <StatTile
                label="Séries"
                value={String(completedSets)}
                icon={<CheckCircle size={14} color="#38BDF8" weight="fill" />}
                iconBackground="rgba(56,189,248,0.12)"
                iconColor="#38BDF8"
              />
              <StatTile
                label="Exercícios"
                value={`${completedExercises}/${sessionExercises.length}`}
                icon={<Flame size={14} color="#F59E0B" weight="fill" />}
                iconBackground="rgba(245,158,11,0.12)"
                iconColor="#F59E0B"
              />
            </View>

            {prLabels.length > 0 ? (
              <AppCard
                className="mb-[18px] flex-row items-center gap-3 px-3.5 py-3"
                style={{
                  backgroundColor: "rgba(251,191,36,0.08)",
                  borderColor: "rgba(251,191,36,0.2)",
                }}
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-[#FBBF24]/15">
                  <TrendUp size={18} color="#FBBF24" weight="bold" />
                </View>
                <View className="flex-1">
                  <AppText className="text-[13px] font-bold text-[#FBBF24]">
                    Novo recorde pessoal!
                  </AppText>
                  <AppText className="mt-0.5 text-[11px] leading-[17px] text-[#FCD56F]">
                    {prLabels.join(" · ")}
                  </AppText>
                </View>
              </AppCard>
            ) : null}

            <View className="mb-[18px]">
              <AppText className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
                Como foi o treino?
              </AppText>
              <View className="flex-row gap-2">
                {RATING_OPTIONS.map(({ value, label, emoji }) => {
                  const active = rating === value;
                  return (
                    <Pressable
                      key={value}
                      accessibilityRole="button"
                      className="flex-1"
                      onPress={(event) =>
                        triggerEmojiBurst(
                          emoji,
                          value,
                          event.nativeEvent.pageX,
                          event.nativeEvent.pageY,
                        )
                      }
                    >
                      <AppCard
                        active={active}
                        className="min-h-[116px] items-center justify-center px-3 py-4"
                      >
                        <View
                          className="mb-2 h-10 w-10 items-center justify-center rounded-full"
                          style={{
                            backgroundColor: active
                              ? "rgba(139,92,246,0.14)"
                              : isDark
                                ? "#0A0A0A"
                                : "#EFEFF1",
                          }}
                        >
                          <AppText className="text-[22px]">{emoji}</AppText>
                        </View>
                        <AppText
                          className={
                            active
                              ? "text-center text-[12px] font-bold text-brand-secondary"
                              : "text-center text-[12px] font-bold text-text-muted"
                          }
                        >
                          {label}
                        </AppText>
                      </AppCard>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="mb-[18px]">
              <AppText className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
                Enviar foto ao coach
              </AppText>
              <Pressable
                accessibilityRole="button"
                className="min-h-[56px] flex-row items-center justify-center gap-2.5 rounded-[14px] px-4"
                onPress={choosePhoto}
                style={{
                  backgroundColor: photoUri
                    ? "rgba(34,197,94,0.08)"
                    : isDark
                      ? "#111111"
                      : "#F7F7F7",
                  borderColor: photoUri
                    ? "rgba(34,197,94,0.36)"
                    : isDark
                      ? "#2A2A2A"
                      : "#D4D4D8",
                  borderStyle: photoUri ? "solid" : "dashed",
                  borderWidth: 1,
                }}
              >
                {photoUri ? (
                  <CheckCircle size={16} color="#22C55E" weight="fill" />
                ) : (
                  <Camera
                    size={16}
                    color={isDark ? "#A1A1AA" : "#71717A"}
                    weight="bold"
                  />
                )}
                <AppText
                  className={
                    photoUri
                      ? "text-[13px] font-semibold text-[#22C55E]"
                      : "text-[13px] font-semibold text-text-muted"
                  }
                >
                  {photoUri
                    ? "Foto selecionada"
                    : "Tirar foto ou escolher da galeria"}
                </AppText>
              </Pressable>

              {photoUri ? (
                <View className="mt-3 overflow-hidden rounded-2xl border border-border-subtle">
                  <Image
                    source={{ uri: photoUri }}
                    resizeMode="cover"
                    style={{ height: 224, width: "100%" }}
                  />
                  <Pressable
                    className="min-h-[46px] flex-row items-center justify-center gap-2 bg-bg-surface"
                    onPress={choosePhoto}
                  >
                    <ImageSquare size={15} color="#A78BFA" weight="bold" />
                    <AppText className="text-[12px] font-bold text-brand-secondary">
                      Trocar foto
                    </AppText>
                  </Pressable>
                </View>
              ) : null}
            </View>

            <View className="mb-[18px]">
              <AppText className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
                Observações para o coach
              </AppText>
              <TextInput
                multiline
                onChangeText={setComment}
                placeholder="Ex: Senti dor no ombro direito no supino. Aumentei a carga no tríceps..."
                placeholderTextColor={isDark ? "#52525B" : "#9CA3AF"}
                style={{
                  backgroundColor: isDark ? "#111111" : "#F7F7F7",
                  borderColor: isDark ? "#262626" : "#E5E7EB",
                  borderRadius: 12,
                  borderWidth: 1,
                  color: isDark ? "#FFFFFF" : "#111827",
                  minHeight: 94,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  textAlignVertical: "top",
                }}
                value={comment}
              />
            </View>

            {submitted ? (
              <View className="gap-3">
                <View
                  className="flex-row items-center gap-2.5 rounded-2xl px-4 py-3"
                  style={{
                    backgroundColor: "rgba(139,92,246,0.08)",
                    borderColor: "rgba(139,92,246,0.2)",
                    borderWidth: 1,
                  }}
                >
                  <CheckCircle size={18} color="#A78BFA" weight="fill" />
                  <AppText className="text-[13px] font-bold text-brand-secondary">
                    Treino salvo com sucesso
                  </AppText>
                </View>

                <AppButton
                  fullWidth
                  leftIcon={
                    <InstagramLogo size={18} color="#111111" weight="bold" />
                  }
                  onPress={shareInstagramStories}
                  variant="secondary"
                >
                  Instagram Stories
                </AppButton>

                <AppButton
                  fullWidth
                  leftIcon={
                    <ShareNetwork size={17} color="#A78BFA" weight="bold" />
                  }
                  onPress={shareOtherApps}
                  variant="secondary"
                >
                  Compartilhar
                </AppButton>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View className="border-t border-border-subtle bg-bg-base px-5 pb-7 pt-4">
          <AppButton
            fullWidth
            leftIcon={<CheckCircle size={18} color="#FFFFFF" weight="fill" />}
            onPress={saveWorkout}
          >
            {submitted ? "Voltar aos treinos" : "Salvar treino"}
          </AppButton>
        </View>
      </View>
    </AppScreen>
  );
}
