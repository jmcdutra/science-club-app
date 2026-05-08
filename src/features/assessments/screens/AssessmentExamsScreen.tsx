import { ArrowLeft, CheckCircle, FileText, PaperPlaneTilt, Trash, UploadSimple } from 'phosphor-react-native';
import { router, type Href, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, View, ActivityIndicator } from 'react-native';
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
import { getExamProgress } from '../utils';
import { getEvaluationById } from '../api/assessments';

export function AssessmentExamsScreen() {
  const { isDark } = useAppTheme();
  const { assessmentId } = useLocalSearchParams<{ assessmentId: string }>();
  const { session } = useAuthStore();
  const drafts = useAssessmentsStore((state) => state.drafts);
  const setExam = useAssessmentsStore((state) => state.setExam);
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
  const progress = getExamProgress(assessment as any, draft);
  const isSubmitted =
    assessment.status === 'analysis' ||
    assessment.status === 'answered' ||
    assessment.status === 'done' ||
    draft.submitted;

  async function handlePickFile(examId: string) {
    if (isSubmitted) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso à galeria nas configurações do dispositivo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.88,
    });
    if (!result.canceled) {
      setExam(assessment.id, examId, result.assets[0].uri);
    }
  }

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
        <AppText className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">Exames</AppText>
        <View className="h-11 w-11" />
      </View>

      <Animated.View entering={FadeInDown.duration(420)}>
        <View className="mb-6 rounded-[28px] border border-border-subtle bg-bg-surface p-5">
          <View className="mb-4 h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10">
            <FileText color="#A78BFA" size={24} weight="duotone" />
          </View>
          <AppText className="text-2xl font-bold leading-tight text-text-main">Exames e anexos</AppText>
          <AppText className="mt-2 text-sm leading-relaxed text-text-muted">
            Selecione fotos dos seus exames ou documentos. Ficam salvos no rascunho até o envio.
          </AppText>

          <View className="mt-5">
            <View className="mb-2 flex-row items-center justify-between">
              <AppText className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
                {progress.done}/{progress.total} anexos
              </AppText>
              <AppText className="text-[11px] font-bold text-brand-secondary">{progress.percent}%</AppText>
            </View>
            <View className="h-1.5 overflow-hidden rounded-full bg-bg-base">
              <View className="h-full rounded-full bg-brand-primary" style={{ width: `${progress.percent}%` }} />
            </View>
          </View>
        </View>
      </Animated.View>

      {assessment.questionnaire.attachment_questions.length ? (
        <View className="gap-3 mb-8">
          {assessment.questionnaire.attachment_questions.map((exam: any, index: number) => {
            const examId = exam.id || exam._id;
            const attached = Boolean(draft.exams[examId]);

            return (
              <Animated.View
                key={examId || index}
                entering={FadeInDown.delay(80 + index * 40).duration(420)}
                style={{
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: attached ? '#34D39930' : undefined,
                }}
                className={cn(attached ? 'bg-emerald-400/8' : 'bg-bg-surface border-border-subtle')}
              >
                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      backgroundColor: isDark ? '#1A1A1A' : '#EFEFEF',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {attached ? (
                      <CheckCircle color="#34D399" size={24} weight="fill" />
                    ) : (
                      <FileText color="#A78BFA" size={22} weight="duotone" />
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
                      <View
                        style={{
                          borderRadius: 99,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          backgroundColor: isDark ? '#222' : '#F0F0F0',
                        }}
                      >
                        <AppText className="text-[10px] font-bold text-text-muted">
                          {exam.required ? 'Obrigatório' : 'Opcional'}
                        </AppText>
                      </View>
                    </View>
                    <AppText className="text-base font-bold text-text-main">{exam.label}</AppText>
                    {exam.description ? (
                      <AppText className="mt-1 text-sm leading-snug text-text-muted">{exam.description}</AppText>
                    ) : null}
                  </View>
                </View>

                <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isSubmitted}
                    style={{
                      minHeight: 44,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      borderRadius: 14,
                      backgroundColor: attached ? (isDark ? '#1A1A1A' : '#EFEFEF') : '#8B5CF6',
                      opacity: isSubmitted ? 0.5 : 1,
                    }}
                    onPress={() => attached ? setExam(assessment.id, examId, null) : handlePickFile(examId)}
                  >
                    {attached ? (
                      <Trash color={isDark ? '#CCC' : '#444'} size={16} weight="bold" />
                    ) : (
                      <UploadSimple color="#FFFFFF" size={16} weight="bold" />
                    )}
                    <AppText
                      className="text-sm font-bold"
                      style={{ color: attached ? (isDark ? '#CCC' : '#444') : '#FFFFFF' }}
                    >
                      {attached ? 'Remover anexo' : 'Selecionar arquivo'}
                    </AppText>
                  </Pressable>
                </View>
              </Animated.View>
            );
          })}
        </View>
      ) : (
        <Animated.View
          entering={FadeInDown.delay(80).duration(420)}
          className="rounded-[24px] border border-border-subtle bg-bg-surface p-5 mb-8"
        >
          <AppText className="text-base font-bold text-text-main">Sem anexos nesta etapa</AppText>
          <AppText className="mt-2 text-sm leading-relaxed text-text-muted">
            Para esta avaliação, a equipe precisa apenas do questionário e das fotos padronizadas.
          </AppText>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(180).duration(420)}>
        <Pressable
          accessibilityRole="button"
          className="min-h-[56px] flex-row items-center justify-center gap-2 rounded-2xl bg-brand-primary"
          onPress={() => router.push(`/(app)/assessments/${assessment.id}/review` as Href)}
        >
          <AppText className="text-base font-bold text-white">Revisar e enviar</AppText>
          <PaperPlaneTilt color="#FFFFFF" size={18} weight="bold" />
        </Pressable>
      </Animated.View>
    </AppScreen>
  );
}
