import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { ArrowLeft, Camera, CheckCircle, ImageSquare, InstagramLogo, ShareNetwork, Trophy } from 'phosphor-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, TextInput, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, SlideInDown } from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';

import { AppScreen } from '@/src/shared/components/ui/AppScreen';
import { AppText } from '@/src/shared/components/ui/AppText';
import { cn } from '@/src/shared/utils/cn';

import { getWorkoutSession } from '../data/workoutSheets';

function formatSeconds(total: number) {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const confetti = [
  { x: 0.08, top: 22, color: '#8B5CF6', delay: 40 },
  { x: 0.18, top: 72, color: '#A78BFA', delay: 120 },
  { x: 0.3, top: 34, color: '#22C55E', delay: 200 },
  { x: 0.46, top: 88, color: '#F59E0B', delay: 80 },
  { x: 0.58, top: 26, color: '#38BDF8', delay: 160 },
  { x: 0.72, top: 78, color: '#FB7185', delay: 240 },
  { x: 0.84, top: 42, color: '#A78BFA', delay: 100 },
];

type NativeShareModule = {
  Social?: {
    INSTAGRAM_STORIES?: string;
  };
  open: (options: Record<string, unknown>) => Promise<unknown>;
  shareSingle: (options: Record<string, unknown>) => Promise<unknown>;
};

function getNativeShareModule() {
  try {
    // react-native-share is not available in Expo Go. Loading lazily keeps this route usable there.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const shareModule = require('react-native-share') as { default?: NativeShareModule } & NativeShareModule;
    return shareModule.default ?? shareModule;
  } catch {
    return null;
  }
}

export function WorkoutFinishScreen() {
  const { width } = useWindowDimensions();
  const composedShareRef = useRef<View>(null);
  const overlayStickerRef = useRef<View>(null);
  const { id, sessionId, elapsed, sets, totalSets, exercises, progressions } = useLocalSearchParams<{
    id: string;
    sessionId?: string;
    elapsed?: string;
    sets?: string;
    totalSets?: string;
    exercises?: string;
    progressions?: string;
  }>();
  const session = getWorkoutSession(id, sessionId);
  const sessionExercises = session.exercises.filter(Boolean);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const elapsedSeconds = Number(elapsed ?? 0);
  const completedSets = Number(sets ?? 0);
  const prescribedSets = Number(totalSets ?? completedSets);
  const completedExercises = Number(exercises ?? sessionExercises.length);
  const progressionCount = Number(progressions ?? 0);

  const shareText = useMemo(
    () =>
      `Conclui ${session.title} no Science Club: ${completedSets}/${prescribedSets} series validas, ${progressionCount} progressoes e ${formatSeconds(elapsedSeconds)} de treino.`,
    [completedSets, elapsedSeconds, prescribedSets, progressionCount, session.title],
  );
  const instagramStoriesAppId = Constants.expoConfig?.extra?.instagramStoriesAppId;

  async function pickCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permissao da camera', 'Autorize a camera para tirar a foto do treino.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.88,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0]?.uri ?? null);
    }
  }

  async function pickLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permissao das fotos', 'Autorize a galeria para anexar uma foto ao treino.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 5],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.88,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0]?.uri ?? null);
    }
  }

  function choosePhoto() {
    Alert.alert('Foto do treino', 'Registre uma foto para o historico e para compartilhar.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Galeria', onPress: pickLibrary },
      { text: 'Tirar foto', onPress: pickCamera },
    ]);
  }

  async function captureComposedCard() {
    if (!composedShareRef.current) {
      return null;
    }

    try {
      return await captureRef(composedShareRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
    } catch {
      return null;
    }
  }

  async function captureOverlaySticker() {
    if (!overlayStickerRef.current) {
      return null;
    }

    try {
      return await captureRef(overlayStickerRef, {
        format: 'png',
        quality: 1,
        result: 'base64',
      });
    } catch {
      return null;
    }
  }

  async function shareInstagramStories() {
    const nativeShare = getNativeShareModule();

    if (!nativeShare) {
      Alert.alert(
        'Build nativa necessaria',
        'O compartilhamento direto no Instagram Stories usa react-native-share e nao funciona no Expo Go. Rode em um dev client/prebuild com o modulo nativo instalado.',
      );
      return;
    }

    const stickerBase64 = await captureOverlaySticker();

    if (!stickerBase64) {
      Alert.alert('Overlay indisponivel', 'Nao foi possivel gerar o PNG transparente do overlay agora.');
      return;
    }

    if (!instagramStoriesAppId || instagramStoriesAppId === 'REPLACE_WITH_FACEBOOK_APP_ID') {
      Alert.alert('Facebook App ID ausente', 'Configure expo.extra.instagramStoriesAppId com o Facebook App ID usado pelo Instagram Stories.');
      return;
    }

    try {
      await nativeShare.shareSingle({
        appId: instagramStoriesAppId,
        backgroundBottomColor: '#000000',
        backgroundTopColor: '#000000',
        social: nativeShare.Social?.INSTAGRAM_STORIES ?? 'instagramstories',
        stickerImage: `data:image/png;base64,${stickerBase64}`,
      });
    } catch {
      Alert.alert('Instagram indisponivel', 'Nao foi possivel abrir o Instagram Stories neste dispositivo.');
    }
  }

  async function shareOtherApps() {
    const nativeShare = getNativeShareModule();

    if (!nativeShare) {
      Alert.alert(
        'Build nativa necessaria',
        'O compartilhamento com imagem usa react-native-share e nao funciona no Expo Go. Rode em um dev client/prebuild para testar este fluxo.',
      );
      return;
    }

    const cardUri = await captureComposedCard();

    if (!cardUri) {
      Alert.alert('Imagem indisponivel', 'Nao foi possivel gerar a imagem composta do treino agora.');
      return;
    }

    await nativeShare.open({
      failOnCancel: false,
      message: shareText,
      title: 'Treino finalizado',
      type: 'image/png',
      url: cardUri,
    });
  }

  function submitWorkout() {
    setSubmitted(true);
  }

  return (
    <AppScreen contentClassName="px-5 pb-12 pt-8" keyboard>
      <View pointerEvents="none" className="absolute inset-x-0 top-0 h-52 overflow-hidden">
        {confetti.map((item, index) => (
          <Animated.View
            key={`${item.x}-${item.top}`}
            entering={SlideInDown.delay(item.delay).duration(760)}
            className={cn('absolute h-3 w-7 rounded-full', index % 2 === 0 && 'w-3')}
            style={{
              backgroundColor: item.color,
              left: width * item.x,
              top: item.top,
              transform: [{ rotate: `${index % 2 === 0 ? 18 : -22}deg` }],
            }}
          />
        ))}
      </View>

      <View className="mb-8 flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          className="h-14 w-14 items-center justify-center rounded-full border border-border-subtle bg-bg-surface"
          onPress={() => router.replace('/(app)/(tabs)/workouts')}
        >
          <ArrowLeft color="#FFFFFF" size={25} weight="bold" />
        </Pressable>
        <View className="rounded-full border border-brand-primary/30 bg-brand-primary/10 px-4 py-2">
          <AppText className="text-sm font-semibold text-brand-secondary">Finalizado</AppText>
        </View>
      </View>

      <Animated.View entering={FadeInDown.duration(420)}>
        <View className="items-center">
          <View className="mb-6 h-24 w-24 items-center justify-center rounded-full border border-brand-primary/30 bg-brand-primary/15">
            <Trophy color="#A78BFA" size={44} weight="duotone" />
          </View>
          <AppText className="text-center text-5xl font-semibold leading-tight text-text-main">Parabens pelo treino</AppText>
          <AppText className="mt-4 text-center text-base leading-relaxed text-text-muted">
            {session.title} ficou registrado. Agora salva sua percepcao do treino para o treinador acompanhar.
          </AppText>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(420)} className="mt-8">
        <View className="rounded-[28px] border border-border-subtle bg-bg-surface px-5 py-5">
          <View
            ref={overlayStickerRef}
            collapsable={false}
            pointerEvents="none"
            style={{
              backgroundColor: 'transparent',
              height: 360,
              left: -1000,
              position: 'absolute',
              top: 0,
              width: 360,
            }}
          >
            <View className="flex-1 items-center justify-center px-7">
              <AppText className="text-sm font-semibold text-white">SCIENCE CLUB</AppText>
              <View className="mt-6 flex-row items-center justify-center gap-6">
                <View className="items-center">
                  <AppText className="text-3xl font-semibold text-white">{completedExercises}</AppText>
                  <AppText className="text-xs text-white/70">exercicios</AppText>
                </View>
                <View className="items-center rounded-full border border-brand-primary/70 bg-brand-primary/20 px-6 py-4">
                  <AppText className="text-4xl font-semibold text-brand-secondary">{completedSets}</AppText>
                  <AppText className="text-xs text-white/70">series validas</AppText>
                </View>
                <View className="items-center">
                  <AppText className="text-3xl font-semibold text-white">{progressionCount}</AppText>
                  <AppText className="text-xs text-white/70">progressoes</AppText>
                </View>
              </View>
              <AppText className="mt-6 text-3xl font-semibold text-white">{formatSeconds(elapsedSeconds)}</AppText>
              <AppText className="mt-1 text-xs text-white/70">duracao</AppText>
              <AppText className="mt-5 text-sm font-semibold text-white">@scienceclub</AppText>
            </View>
          </View>

          <View className="flex-row gap-3">
            {[
              { label: 'Tempo', value: formatSeconds(elapsedSeconds) },
              { label: 'Series validas', value: String(completedSets) },
              { label: 'Progressoes', value: String(progressionCount) },
            ].map((item) => (
              <View key={item.label} className="flex-1 rounded-2xl bg-bg-base px-3 py-3">
                <AppText className="text-xs text-text-muted">{item.label}</AppText>
                <AppText className="mt-1 text-base font-semibold text-text-main">{item.value}</AppText>
              </View>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            className={cn(
              'mt-5 min-h-[64px] flex-row items-center justify-center gap-3 rounded-2xl border px-5',
              photoUri ? 'border-brand-primary/40 bg-brand-primary/12' : 'border-border-subtle bg-bg-base',
            )}
            onPress={choosePhoto}
          >
            {photoUri ? <CheckCircle color="#A78BFA" size={22} weight="bold" /> : <Camera color="#A78BFA" size={22} weight="duotone" />}
            <AppText className="text-base font-semibold text-text-main">
              {photoUri ? 'Foto anexada ao treino' : 'Tirar ou escolher foto'}
            </AppText>
          </Pressable>

          {photoUri ? (
            <View className="mt-4 overflow-hidden rounded-[24px] border border-border-subtle bg-bg-base">
              <Image source={{ uri: photoUri }} className="h-64 w-full" resizeMode="cover" />
              <Pressable className="min-h-[48px] flex-row items-center justify-center gap-2" onPress={choosePhoto}>
                <ImageSquare color="#A78BFA" size={18} weight="duotone" />
                <AppText className="text-sm font-semibold text-text-main">Trocar foto</AppText>
              </Pressable>
            </View>
          ) : null}

          <View
            ref={composedShareRef}
            collapsable={false}
            className="mt-4 overflow-hidden rounded-[28px] border border-border-subtle bg-bg-base px-5 py-5"
          >
            {photoUri ? <Image source={{ uri: photoUri }} className="absolute inset-0 h-full w-full opacity-20" resizeMode="cover" /> : null}
            <View className="absolute inset-0 opacity-40">
              {Array.from({ length: 42 }).map((_, index) => (
                <View
                  key={index}
                  className="absolute h-6 w-6"
                  style={{
                    backgroundColor: index % 2 === 0 ? '#151515' : '#0B0B0B',
                    left: (index % 7) * 56,
                    top: Math.floor(index / 7) * 28,
                  }}
                />
              ))}
            </View>
            <View className="items-center">
              <AppText className="text-sm font-semibold text-text-main">SCIENCE CLUB</AppText>
              <View className="mt-5 flex-row items-center justify-center gap-8">
                <View className="items-center">
                  <AppText className="text-3xl font-semibold text-text-main">{completedExercises}</AppText>
                  <AppText className="text-xs text-text-muted">exercicios</AppText>
                </View>
                <View className="items-center rounded-full border border-brand-primary/50 bg-brand-primary/10 px-7 py-4">
                  <AppText className="text-4xl font-semibold text-brand-secondary">{completedSets}</AppText>
                  <AppText className="text-xs text-text-muted">series validas</AppText>
                </View>
                <View className="items-center">
                  <AppText className="text-3xl font-semibold text-text-main">{progressionCount}</AppText>
                  <AppText className="text-xs text-text-muted">progressoes</AppText>
                </View>
              </View>
              <AppText className="mt-5 text-3xl font-semibold text-text-main">{formatSeconds(elapsedSeconds)}</AppText>
              <AppText className="mt-1 text-xs text-text-muted">duracao</AppText>
              <AppText className="mt-5 text-sm font-semibold text-text-main">@scienceclub</AppText>
            </View>
          </View>

          <TextInput
            className="mt-4 min-h-[118px] rounded-2xl bg-bg-base px-4 py-4 text-base leading-relaxed text-text-main"
            multiline
            onChangeText={setComment}
            placeholder="Como foi o treino? Energia, cargas, dor, observacoes para o coach..."
            placeholderTextColor="#8A8D99"
            textAlignVertical="top"
            value={comment}
          />

          {!submitted ? (
            <Pressable
              accessibilityRole="button"
              className="mt-5 min-h-[58px] items-center justify-center rounded-2xl bg-brand-primary px-5"
              onPress={submitWorkout}
            >
              <AppText className="text-base font-semibold text-white">Enviar registro</AppText>
            </Pressable>
          ) : (
            <View className="mt-5 gap-3">
              <View className="rounded-2xl border border-brand-primary/30 bg-brand-primary/10 px-4 py-4">
                <AppText className="text-base font-semibold text-brand-secondary">Registro enviado</AppText>
                <AppText className="mt-1 text-sm leading-snug text-text-muted">
                  Foto, comentario e resumo ficaram prontos para historico e acompanhamento.
                </AppText>
              </View>

              <Pressable
                accessibilityRole="button"
                className="min-h-[58px] flex-row items-center justify-center gap-3 rounded-2xl bg-white px-5"
                onPress={shareInstagramStories}
              >
                <InstagramLogo color="#111111" size={22} weight="bold" />
                <AppText className="text-base font-semibold text-bg-base">Compartilhar no Instagram</AppText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                className="min-h-[54px] flex-row items-center justify-center gap-2 rounded-2xl border border-border-subtle bg-bg-base px-5"
                onPress={shareOtherApps}
              >
                <ShareNetwork color="#A78BFA" size={20} weight="duotone" />
                <AppText className="text-base font-semibold text-text-main">Compartilhar em outros apps</AppText>
              </Pressable>
            </View>
          )}
        </View>
      </Animated.View>
    </AppScreen>
  );
}
