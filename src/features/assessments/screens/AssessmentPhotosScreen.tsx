import { ArrowLeft, Camera, Flask, ImageSquare, PaperPlaneTilt } from 'phosphor-react-native';
import { router, type Href, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, View, Image, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';

import { AppScreen } from '@/src/shared/components/ui/AppScreen';
import { AppText } from '@/src/shared/components/ui/AppText';
import { useAppTheme } from '@/src/shared/theme/appTheme';
import { cn } from '@/src/shared/utils/cn';
import { useAuthStore } from '@/src/features/auth/services/auth.store';

import { createAssessmentDraft, useAssessmentsStore } from '../services/assessments.store';
import { getPhotoProgress } from '../utils';
import { getEvaluationById } from '../api/assessments';

export function AssessmentPhotosScreen() {
  const { isDark } = useAppTheme();
  const { assessmentId } = useLocalSearchParams<{ assessmentId: string }>();
  const { session } = useAuthStore();
  const drafts = useAssessmentsStore((state) => state.drafts);
  const setPhoto = useAssessmentsStore((state) => state.setPhoto);
  const initializeDraft = useAssessmentsStore((state) => state.initializeDraft);

  const { data: assessment, isLoading } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => getEvaluationById(session?.token!, assessmentId!),
    enabled: !!session?.token && !!assessmentId,
  });

  useEffect(() => {
    if (assessment) {
      initializeDraft(assessment as any);
    }
  }, [assessment, initializeDraft]);

  if (isLoading || !assessment) {
    return (
      <AppScreen contentClassName="items-center justify-center">
        <ActivityIndicator size="large" color="#A78BFA" />
      </AppScreen>
    );
  }

  const draft = drafts[assessment.id] ?? createAssessmentDraft(assessment as any);
  const progress = getPhotoProgress(assessment as any, draft);
  const isSubmitted =
    assessment.status === 'analysis' ||
    assessment.status === 'answered' ||
    assessment.status === 'done' ||
    draft.submitted;

  async function pickCamera(poseId: string) {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso à câmera nas configurações do dispositivo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.88 });
    if (!result.canceled) setPhoto(assessment!.id, poseId, result.assets[0].uri);
  }

  async function pickLibrary(poseId: string) {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso à galeria nas configurações do dispositivo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.88,
    });
    if (!result.canceled) setPhoto(assessment!.id, poseId, result.assets[0].uri);
  }

  function choosePhoto(poseId: string) {
    Alert.alert('Adicionar foto', 'Escolha a origem da foto.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Galeria', onPress: () => pickLibrary(poseId) },
      { text: 'Câmera', onPress: () => pickCamera(poseId) },
    ]);
  }

  const handleNext = () => {
    const hasExams = assessment.questionnaire.attachment_questions.length > 0;
    if (hasExams) {
      router.push(`/(app)/assessments/${assessment.id}/exams` as Href);
    } else {
      router.push(`/(app)/assessments/${assessment.id}/review` as Href);
    }
  };

  return (
    <AppScreen contentClassName="px-5 pb-12 pt-5">
      {/* Header */}
      <View className="mb-10 flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center rounded-full bg-bg-surface border border-border-subtle"
          onPress={() => router.back()}
        >
          <ArrowLeft color={isDark ? '#FFFFFF' : '#111827'} size={20} weight="bold" />
        </Pressable>
        <AppText className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">Fotos</AppText>
        <View className="h-11 w-11" />
      </View>

      <Animated.View entering={FadeInDown.duration(420)}>
        <View className="mb-6 rounded-[28px] border border-border-subtle bg-bg-surface p-5">
          <View className="mb-4 h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10">
            <Camera color="#A78BFA" size={24} weight="duotone" />
          </View>
          <AppText className="text-2xl font-bold leading-tight text-text-main">Fotos corporais</AppText>
          <AppText className="mt-2 text-sm leading-relaxed text-text-muted">
            Padronize iluminação, distância e postura. A foto fica salva no rascunho até o envio final.
          </AppText>

          <View className="mt-5">
            <View className="mb-2 flex-row items-center justify-between">
              <AppText className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
                {progress.done}/{progress.total} fotos
              </AppText>
              <AppText className="text-[11px] font-bold text-brand-secondary">{progress.percent}%</AppText>
            </View>
            <View className="h-1.5 overflow-hidden rounded-full bg-bg-base">
              <View className="h-full rounded-full bg-brand-primary" style={{ width: `${progress.percent}%` }} />
            </View>
          </View>
        </View>
      </Animated.View>

      <View className="gap-3 mb-8">
        {assessment.questionnaire.image_questions.map((pose: any, index: number) => {
          const poseId = pose.id || pose._id;
          const photoUri = draft.photos[poseId];
          const added = Boolean(photoUri);

          return (
            <Animated.View
              key={poseId || index}
              entering={FadeInDown.delay(80 + index * 35).duration(420)}
              style={{
                borderRadius: 24,
                borderWidth: 1,
                borderColor: added ? '#34D39930' : undefined,
                overflow: 'hidden',
              }}
              className={cn(added ? 'bg-emerald-400/8' : 'bg-bg-surface border-border-subtle')}
            >
              {/* Photo preview */}
              {added && photoUri ? (
                <View style={{ height: 140, width: '100%' }}>
                  <Image
                    source={{ uri: photoUri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                </View>
              ) : null}

              <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                {!added && (
                  <View
                    style={{
                      width: 56,
                      height: 72,
                      borderRadius: 16,
                      backgroundColor: isDark ? '#1A1A1A' : '#EFEFEF',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ImageSquare color="#555" size={24} weight="duotone" />
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <AppText className="flex-1 text-base font-bold text-text-main">{pose.label}</AppText>
                    <View
                      style={{
                        borderRadius: 99,
                        paddingHorizontal: 10,
                        paddingVertical: 3,
                        backgroundColor: added ? '#34D39915' : '#FCD34D15',
                      }}
                    >
                      <AppText
                        className="text-[10px] font-bold uppercase tracking-wide"
                        style={{ color: added ? '#34D399' : '#FCD34D' }}
                      >
                        {added ? 'Adicionada' : 'Pendente'}
                      </AppText>
                    </View>
                  </View>
                  {pose.description ? (
                    <AppText className="text-sm text-text-muted leading-snug">{pose.description}</AppText>
                  ) : null}
                </View>
              </View>

              <View style={{ paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', gap: 8 }}>
                <Pressable
                  accessibilityRole="button"
                  disabled={isSubmitted}
                  style={{
                    flex: 1,
                    minHeight: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 14,
                    backgroundColor: added ? (isDark ? '#1A1A1A' : '#EFEFEF') : '#8B5CF6',
                    opacity: isSubmitted ? 0.5 : 1,
                  }}
                  onPress={() => added ? setPhoto(assessment.id, poseId, null) : choosePhoto(poseId)}
                >
                  <AppText
                    className="text-sm font-bold"
                    style={{ color: added ? (isDark ? '#CCC' : '#444') : '#FFFFFF' }}
                  >
                    {added ? 'Remover' : 'Adicionar foto'}
                  </AppText>
                </Pressable>
                {!added && (
                  <Pressable
                    accessibilityRole="button"
                    disabled={isSubmitted}
                    style={{
                      minHeight: 44,
                      paddingHorizontal: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 14,
                      backgroundColor: isDark ? '#1A1A1A' : '#EFEFEF',
                    }}
                    onPress={() => pickCamera(poseId)}
                  >
                    <Camera color={isDark ? '#AAA' : '#555'} size={18} weight="bold" />
                  </Pressable>
                )}
              </View>
            </Animated.View>
          );
        })}
      </View>

      <Animated.View entering={FadeInDown.delay(220).duration(420)}>
        <Pressable
          accessibilityRole="button"
          className="min-h-[56px] flex-row items-center justify-center gap-2 rounded-2xl bg-brand-primary"
          onPress={handleNext}
        >
          <AppText className="text-base font-bold text-white">
            {assessment.questionnaire.attachment_questions.length > 0
              ? 'Continuar para anexos'
              : 'Revisar e enviar'}
          </AppText>
          {assessment.questionnaire.attachment_questions.length > 0 ? (
            <Flask color="#FFFFFF" size={18} weight="bold" />
          ) : (
            <PaperPlaneTilt color="#FFFFFF" size={18} weight="bold" />
          )}
        </Pressable>
      </Animated.View>
    </AppScreen>
  );
}
