import { ArrowLeft, Camera, CheckCircle, Flask, Image, PaperPlaneTilt } from 'phosphor-react-native';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Image as RNImage, Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';

import { AppScreen } from '@/src/shared/components/ui/AppScreen';
import { AppButton } from '@/src/shared/components/ui/AppButton';
import { AppText } from '@/src/shared/components/ui/AppText';
import { useAuthStore } from '@/src/features/auth/services/auth.store';
import { useRefetchOnFocus } from '@/src/shared/hooks/useRefetchOnFocus';

import { createAssessmentDraft, useAssessmentsStore } from '../services/assessments.store';
import { getPhotoProgress } from '../utils';
import { getEvaluationById } from '../api/assessments';

export function AssessmentPhotosScreen() {
  const router = useRouter();
  const { assessmentId } = useLocalSearchParams<{ assessmentId: string }>();
  const { session } = useAuthStore();
  const drafts = useAssessmentsStore((state) => state.drafts);
  const setPhoto = useAssessmentsStore((state) => state.setPhoto);
  const initializeDraft = useAssessmentsStore((state) => state.initializeDraft);

  const { data: assessment, isLoading, refetch } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => getEvaluationById(session?.token!, assessmentId!),
    enabled: !!session?.token && !!assessmentId,
  });
  useRefetchOnFocus(refetch, Boolean(session?.token && assessmentId));

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
      Alert.alert('Permissão necessária', 'Autorize o acesso à câmera nas configurações.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.88 });
    if (!result.canceled) setPhoto(assessment!.id, poseId, result.assets[0].uri);
  }

  async function pickLibrary(poseId: string) {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso à galeria nas configurações.');
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
    router.push(
      hasExams
        ? (`/(app)/assessments/${assessment.id}/exams` as Href)
        : (`/(app)/assessments/${assessment.id}/review` as Href),
    );
  };

  return (
    <AppScreen contentClassName="px-6 pb-12 pt-5">
      {/* ── Back bar ── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <Pressable
          accessibilityRole="button"
          style={{
            width: 44, height: 44, borderRadius: 99,
            backgroundColor: '#111111', borderWidth: 1, borderColor: '#222222',
            alignItems: 'center', justifyContent: 'center',
          }}
          onPress={() => router.back()}
        >
          <ArrowLeft color="#FFFFFF" size={20} weight="bold" />
        </Pressable>
        <AppText
          style={{
            fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
            letterSpacing: 3, color: '#555555',
          }}
        >
          Fotos Corporais
        </AppText>
        <View style={{ width: 44 }} />
      </View>

      <Animated.View entering={FadeInDown.duration(420)}>
        {/* ── Editorial heading ── */}
        <AppText
          className="font-heading"
          style={{
            fontSize: 22,
            fontWeight: '600',
            letterSpacing: -0.5,
            color: '#FFFFFF',
            marginBottom: 6,
            lineHeight: 28,
          }}
        >
          Registro corporal
        </AppText>
        <AppText style={{ fontSize: 13, color: '#666666', lineHeight: 18, marginBottom: 20 }}>
          Padronize iluminação, distância e postura. As fotos ficam salvas até o envio final.
        </AppText>

        {/* ── Progress strip ── */}
        <View style={{ marginBottom: 28 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <AppText style={{ fontSize: 12, fontWeight: '600', color: '#666666' }}>
              {progress.done} de {progress.total} fotos
            </AppText>
            <AppText style={{ fontSize: 11, fontWeight: '700', color: '#A78BFA' }}>
              {progress.percent}%
            </AppText>
          </View>
          <View style={{ height: 3, borderRadius: 99, backgroundColor: '#1A1A1A' }}>
            <View
              style={{
                height: 3,
                borderRadius: 99,
                backgroundColor: '#8B5CF6',
                width: `${progress.percent}%`,
              }}
            />
          </View>
        </View>
      </Animated.View>

      {/* ── Photo cards ── */}
      <View style={{ gap: 8, marginBottom: 24 }}>
        {assessment.questionnaire.image_questions.map((pose: any, index: number) => {
          const poseId = pose.id || pose._id;
          const photoUri = draft.photos[poseId];
          const added = Boolean(photoUri);

          return (
            <Animated.View
              key={poseId || index}
              entering={FadeInDown.delay(60 + index * 40).duration(420)}
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: added ? 'rgba(52,211,153,0.20)' : '#222222',
                backgroundColor: '#111111',
                overflow: 'hidden',
              }}
            >
              {added && photoUri ? (
                <View style={{ height: 130, width: '100%' }}>
                  <RNImage
                    source={{ uri: photoUri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                  <View
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle size={16} color="#34D399" weight="fill" />
                  </View>
                </View>
              ) : null}

              <View style={{ padding: 14 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: added ? 10 : 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <AppText style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginBottom: 2 }}>
                      {pose.label}
                    </AppText>
                    {pose.description ? (
                      <AppText style={{ fontSize: 11, color: '#666666', lineHeight: 15 }}>
                        {pose.description}
                      </AppText>
                    ) : null}
                  </View>
                  {!added && (
                    <View
                      style={{
                        width: 48,
                        height: 56,
                        borderRadius: 10,
                        backgroundColor: '#1A1A1A',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: 12,
                        flexShrink: 0,
                      }}
                    >
                      <Image size={20} color="#444444" weight="duotone" />
                    </View>
                  )}
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {added ? (
                    <AppButton
                      variant="secondary"
                      fullWidth
                      disabled={isSubmitted}
                      onPress={() => setPhoto(assessment.id, poseId, null)}
                    >
                      <AppText style={{ color: '#888888', fontWeight: '600', fontSize: 13 }}>
                        Remover foto
                      </AppText>
                    </AppButton>
                  ) : (
                    <>
                      <AppButton
                        variant="primary"
                        fullWidth
                        disabled={isSubmitted}
                        onPress={() => choosePhoto(poseId)}
                      >
                        <AppText style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 13 }}>
                          Adicionar foto
                        </AppText>
                      </AppButton>
                      <Pressable
                        accessibilityRole="button"
                        disabled={isSubmitted}
                        onPress={() => pickCamera(poseId)}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          backgroundColor: '#1A1A1A',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Camera size={18} color="#888888" weight="bold" />
                      </Pressable>
                    </>
                  )}
                </View>
              </View>
            </Animated.View>
          );
        })}
      </View>

      {/* ── CTA ── */}
      <Animated.View entering={FadeInDown.delay(200).duration(420)}>
        <AppButton
          variant="primary"
          fullWidth
          onPress={handleNext}
          rightIcon={
            assessment.questionnaire.attachment_questions.length > 0
              ? <Flask color="#fff" size={18} weight="bold" />
              : <PaperPlaneTilt color="#fff" size={18} weight="bold" />
          }
        >
          <AppText style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
            {assessment.questionnaire.attachment_questions.length > 0
              ? 'Continuar para anexos'
              : 'Revisar e enviar'}
          </AppText>
        </AppButton>
      </Animated.View>
    </AppScreen>
  );
}
