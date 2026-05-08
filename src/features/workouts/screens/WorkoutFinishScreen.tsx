import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { ArrowLeft, Camera, CheckCircle, ImageSquare, InstagramLogo, ShareNetwork, TrendUp } from 'phosphor-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';

import { AppScreen } from '@/src/shared/components/ui/AppScreen';
import { AppText } from '@/src/shared/components/ui/AppText';
import { useAppTheme } from '@/src/shared/theme/appTheme';
import { cn } from '@/src/shared/utils/cn';

import { getWorkoutSession } from '../data/workoutSheets';

function formatSeconds(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

type NativeShareModule = {
  Social?: { INSTAGRAM_STORIES?: string };
  open: (options: Record<string, unknown>) => Promise<unknown>;
  shareSingle: (options: Record<string, unknown>) => Promise<unknown>;
};

function getNativeShareModule() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const shareModule = require('react-native-share') as { default?: NativeShareModule } & NativeShareModule;
    return shareModule.default ?? shareModule;
  } catch {
    return null;
  }
}

export function WorkoutFinishScreen() {
  const { isDark } = useAppTheme();
  const composedShareRef = useRef<View>(null);
  const overlayStickerRef = useRef<View>(null);
  const { id, sessionId, elapsed, sets, totalSets, exercises, progressions } = useLocalSearchParams<{
    id: string; sessionId?: string; elapsed?: string; sets?: string;
    totalSets?: string; exercises?: string; progressions?: string;
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
  const instagramStoriesAppId = Constants.expoConfig?.extra?.instagramStoriesAppId;

  const shareText = useMemo(
    () =>
      `${session.title} no Science Club — ${completedSets}/${prescribedSets} séries, ${progressionCount} progressões, ${formatSeconds(elapsedSeconds)}.`,
    [completedSets, elapsedSeconds, prescribedSets, progressionCount, session.title],
  );

  async function pickCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permissão da câmera', 'Autorize a câmera para registrar o treino.'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 5], quality: 0.88 });
    if (!result.canceled) setPhotoUri(result.assets[0]?.uri ?? null);
  }

  async function pickLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permissão de fotos', 'Autorize a galeria para anexar uma foto.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true, aspect: [4, 5],
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.88,
    });
    if (!result.canceled) setPhotoUri(result.assets[0]?.uri ?? null);
  }

  function choosePhoto() {
    Alert.alert('Foto do treino', 'Registre uma foto para o histórico.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Galeria', onPress: pickLibrary },
      { text: 'Câmera', onPress: pickCamera },
    ]);
  }

  async function captureComposedCard() {
    if (!composedShareRef.current) return null;
    try { return await captureRef(composedShareRef, { format: 'png', quality: 1, result: 'tmpfile' }); }
    catch { return null; }
  }

  async function captureOverlaySticker() {
    if (!overlayStickerRef.current) return null;
    try { return await captureRef(overlayStickerRef, { format: 'png', quality: 1, result: 'base64' }); }
    catch { return null; }
  }

  async function shareInstagramStories() {
    const nativeShare = getNativeShareModule();
    if (!nativeShare) { Alert.alert('Build nativa necessária', 'Compartilhamento direto no Instagram requer build nativa.'); return; }
    const stickerBase64 = await captureOverlaySticker();
    if (!stickerBase64) { Alert.alert('Erro', 'Não foi possível gerar o overlay.'); return; }
    if (!instagramStoriesAppId || instagramStoriesAppId === 'REPLACE_WITH_FACEBOOK_APP_ID') {
      Alert.alert('Facebook App ID ausente', 'Configure instagramStoriesAppId no app.json.'); return;
    }
    try {
      await nativeShare.shareSingle({
        appId: instagramStoriesAppId, backgroundBottomColor: '#000000', backgroundTopColor: '#000000',
        social: nativeShare.Social?.INSTAGRAM_STORIES ?? 'instagramstories',
        stickerImage: `data:image/png;base64,${stickerBase64}`,
      });
    } catch { Alert.alert('Erro', 'Não foi possível abrir o Instagram Stories.'); }
  }

  async function shareOtherApps() {
    const nativeShare = getNativeShareModule();
    if (!nativeShare) { Alert.alert('Build nativa necessária', 'Compartilhamento com imagem requer build nativa.'); return; }
    const cardUri = await captureComposedCard();
    if (!cardUri) { Alert.alert('Erro', 'Não foi possível gerar a imagem.'); return; }
    await nativeShare.open({ failOnCancel: false, message: shareText, title: 'Treino finalizado', type: 'image/png', url: cardUri });
  }

  function submitWorkout() { setSubmitted(true); }

  return (
    <AppScreen contentClassName="px-6 pb-16 pt-8" keyboard>
      {/* Views ocultas para captura/share */}
      <View
        ref={overlayStickerRef}
        collapsable={false}
        pointerEvents="none"
        style={{ backgroundColor: 'transparent', height: 360, left: -1000, position: 'absolute', top: 0, width: 360 }}
      >
        <View className="flex-1 items-center justify-center px-7">
          <AppText className="text-sm font-semibold text-white">SCIENCE CLUB</AppText>
          <View className="mt-6 flex-row items-center justify-center gap-6">
            <View className="items-center">
              <AppText className="text-3xl font-semibold text-white">{completedExercises}</AppText>
              <AppText className="text-xs text-white/70">exercícios</AppText>
            </View>
            <View className="items-center rounded-full border border-brand-primary/70 bg-brand-primary/20 px-6 py-4">
              <AppText className="text-4xl font-semibold text-brand-secondary">{completedSets}</AppText>
              <AppText className="text-xs text-white/70">séries</AppText>
            </View>
            <View className="items-center">
              <AppText className="text-3xl font-semibold text-white">{progressionCount}</AppText>
              <AppText className="text-xs text-white/70">progressões</AppText>
            </View>
          </View>
          <AppText className="mt-6 text-3xl font-semibold text-white">{formatSeconds(elapsedSeconds)}</AppText>
          <AppText className="mt-5 text-sm font-semibold text-white">@scienceclub</AppText>
        </View>
      </View>

      <View
        ref={composedShareRef}
        collapsable={false}
        style={{ position: 'absolute', left: -1000, top: 0, width: 360, height: 360, backgroundColor: isDark ? '#000000' : '#FFFFFF' }}
      >
        {photoUri ? <Image source={{ uri: photoUri }} className="absolute inset-0 h-full w-full opacity-20" resizeMode="cover" /> : null}
        <View className="flex-1 items-center justify-center px-7">
          <AppText className="text-sm font-semibold text-text-main">SCIENCE CLUB</AppText>
          <View className="mt-5 flex-row items-center justify-center gap-8">
            <View className="items-center">
              <AppText className="text-3xl font-semibold text-text-main">{completedExercises}</AppText>
              <AppText className="text-xs text-text-muted">exercícios</AppText>
            </View>
            <View className="items-center rounded-full border border-brand-primary/50 bg-brand-primary/10 px-7 py-4">
              <AppText className="text-4xl font-semibold text-brand-secondary">{completedSets}</AppText>
              <AppText className="text-xs text-text-muted">séries</AppText>
            </View>
            <View className="items-center">
              <AppText className="text-3xl font-semibold text-text-main">{progressionCount}</AppText>
              <AppText className="text-xs text-text-muted">progressões</AppText>
            </View>
          </View>
          <AppText className="mt-5 text-3xl font-semibold text-text-main">{formatSeconds(elapsedSeconds)}</AppText>
          <AppText className="mt-1 text-xs text-text-muted">duração</AppText>
          <AppText className="mt-5 text-sm font-semibold text-text-main">@scienceclub</AppText>
        </View>
      </View>

      {/* Header */}
      <View className="mb-10 flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center rounded-full bg-bg-surface border border-border-subtle"
          onPress={() => router.replace('/(app)/(tabs)/workouts')}
        >
          <ArrowLeft color={isDark ? '#FFFFFF' : '#111827'} size={20} weight="bold" />
        </Pressable>
        <View
          className="rounded-full px-4 py-1.5"
          style={{
            backgroundColor: 'rgba(139,92,246,0.1)',
            borderWidth: 1,
            borderColor: 'rgba(139,92,246,0.2)',
          }}
        >
          <AppText className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand-secondary">
            Concluído
          </AppText>
        </View>
      </View>

      {/* Hero — left-aligned, tipográfico */}
      <Animated.View entering={FadeInDown.springify().damping(22).stiffness(180)} className="mb-8">
        <AppText className="text-[11px] font-bold uppercase tracking-[0.25em] text-text-muted mb-2">
          {session.title} · {session.type}
        </AppText>
        <AppText className="font-heading text-4xl font-bold text-text-main mb-6">
          {'Treino\nconcluído.'}
        </AppText>

        {/* Stats em linha — sem card */}
        <View className="flex-row items-center gap-6">
          <View>
            <AppText className="font-heading text-2xl font-bold text-text-main">
              {formatSeconds(elapsedSeconds)}
            </AppText>
            <AppText className="text-[11px] font-bold uppercase tracking-wide text-text-muted mt-0.5">
              Duração
            </AppText>
          </View>
          <View className="h-8 w-px bg-border-subtle" />
          <View>
            <AppText className="font-heading text-2xl font-bold text-text-main">
              {completedSets}
            </AppText>
            <AppText className="text-[11px] font-bold uppercase tracking-wide text-text-muted mt-0.5">
              Séries
            </AppText>
          </View>
          {progressionCount > 0 && (
            <>
              <View className="h-8 w-px bg-border-subtle" />
              <View className="flex-row items-center gap-1.5">
                <TrendUp color="#A78BFA" size={16} weight="bold" />
                <View>
                  <AppText className="font-heading text-2xl font-bold text-brand-secondary">
                    {progressionCount}
                  </AppText>
                  <AppText className="text-[11px] font-bold uppercase tracking-wide text-text-muted mt-0.5">
                    Progr.
                  </AppText>
                </View>
              </View>
            </>
          )}
        </View>
      </Animated.View>

      {/* Divider */}
      <View className="border-t border-border-subtle mb-8" />

      {/* Seção de registro */}
      <Animated.View
        entering={FadeInDown.springify().damping(22).stiffness(180).delay(80)}
        className="gap-4"
      >
        {/* Foto */}
        <Pressable
          accessibilityRole="button"
          className={cn(
            'min-h-[54px] flex-row items-center justify-center gap-2.5 rounded-2xl',
            photoUri ? 'border border-brand-primary/30 bg-brand-primary/8' : 'bg-bg-surface border border-border-subtle',
          )}
          onPress={choosePhoto}
        >
          {photoUri
            ? <CheckCircle color="#A78BFA" size={18} weight="bold" />
            : <Camera color="#A78BFA" size={18} weight="duotone" />}
          <AppText className="text-sm font-bold text-text-main">
            {photoUri ? 'Foto anexada' : 'Tirar ou escolher foto'}
          </AppText>
        </Pressable>

        {photoUri && (
          <View
            className="overflow-hidden rounded-2xl"
            style={{ borderWidth: 1, borderColor: isDark ? '#222' : '#E5E7EB' }}
          >
            <Image source={{ uri: photoUri }} className="h-56 w-full" resizeMode="cover" />
            <Pressable
              className="min-h-[44px] flex-row items-center justify-center gap-2 bg-bg-surface"
              onPress={choosePhoto}
            >
              <ImageSquare color="#A78BFA" size={15} weight="duotone" />
              <AppText className="text-xs font-bold text-text-muted">Trocar foto</AppText>
            </Pressable>
          </View>
        )}

        {/* Comentário */}
        <TextInput
          className="min-h-[100px] rounded-2xl bg-bg-surface px-4 py-4 text-sm leading-relaxed text-text-main"
          style={{ borderWidth: 1, borderColor: isDark ? '#222222' : '#E5E7EB' }}
          multiline
          onChangeText={setComment}
          placeholder="Como foi o treino? Observações para o coach..."
          placeholderTextColor={isDark ? '#444444' : '#9CA3AF'}
          textAlignVertical="top"
          value={comment}
        />

        {/* Submit / Share */}
        {!submitted ? (
          <Pressable
            accessibilityRole="button"
            className="min-h-[56px] items-center justify-center rounded-2xl bg-brand-primary"
            onPress={submitWorkout}
          >
            <AppText className="text-base font-bold text-white">Enviar registro</AppText>
          </Pressable>
        ) : (
          <View className="gap-3">
            {/* Confirmação */}
            <View
              className="flex-row items-center gap-2.5 rounded-2xl px-5 py-4"
              style={{
                borderWidth: 1,
                borderColor: 'rgba(139,92,246,0.2)',
                backgroundColor: 'rgba(139,92,246,0.08)',
              }}
            >
              <CheckCircle color="#A78BFA" size={18} weight="bold" />
              <AppText className="text-sm font-bold text-brand-secondary">Registro enviado com sucesso</AppText>
            </View>

            {/* Instagram Stories */}
            <Pressable
              accessibilityRole="button"
              className="min-h-[52px] flex-row items-center justify-center gap-2.5 rounded-2xl bg-white"
              onPress={shareInstagramStories}
            >
              <InstagramLogo color="#111111" size={18} weight="bold" />
              <AppText className="text-sm font-bold text-black">Instagram Stories</AppText>
            </Pressable>

            {/* Compartilhar */}
            <Pressable
              accessibilityRole="button"
              className="min-h-[50px] flex-row items-center justify-center gap-2 rounded-2xl bg-bg-surface border border-border-subtle"
              onPress={shareOtherApps}
            >
              <ShareNetwork color="#A78BFA" size={17} weight="duotone" />
              <AppText className="text-sm font-bold text-text-main">Compartilhar</AppText>
            </Pressable>
          </View>
        )}
      </Animated.View>
    </AppScreen>
  );
}
