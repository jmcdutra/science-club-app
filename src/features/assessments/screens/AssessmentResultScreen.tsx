import { ArrowLeft, CalendarCheck, CheckCircle, ForkKnife, ListChecks, SealCheck } from 'phosphor-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppScreen } from '@/src/shared/components/ui/AppScreen';
import { AppText } from '@/src/shared/components/ui/AppText';
import { useAppTheme } from '@/src/shared/theme/appTheme';

import { useAssessmentsStore } from '../services/assessments.store';

export function AssessmentResultScreen() {
  const { isDark } = useAppTheme();
  const { assessmentId } = useLocalSearchParams<{ assessmentId: string }>();
  const assessments = useAssessmentsStore((state) => state.assessments);
  const assessment = assessments.find((item) => item.id === assessmentId) ?? assessments[0];
  const result = assessment.result;

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
        <AppText className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">Parecer</AppText>
        <View className="h-11 w-11" />
      </View>

      <Animated.View entering={FadeInDown.duration(420)}>
        <View className="mb-6 overflow-hidden rounded-[28px] border border-border-subtle bg-bg-surface p-5">
          <View className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-emerald-400/8" />
          <View className="mb-4 h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10">
            <SealCheck color="#34D399" size={24} weight="duotone" />
          </View>
          <AppText className="text-2xl font-bold leading-tight text-text-main">
            {result ? 'Parecer entregue' : 'Parecer em preparo'}
          </AppText>
          <AppText className="mt-2 text-base leading-relaxed text-text-muted">
            {result
              ? `${assessment.title} · ${result.deliveredAt}`
              : 'A equipe ainda está analisando seu envio. Assim que concluir, o parecer aparecerá aqui.'}
          </AppText>
        </View>
      </Animated.View>

      {result ? (
        <View className="gap-4">
          <Animated.View
            entering={FadeInDown.delay(80).duration(420)}
            className="rounded-[24px] border border-border-subtle bg-bg-surface p-5"
          >
            <AppText className="text-[11px] font-bold uppercase tracking-[0.25em] text-text-muted mb-3">
              Mensagem da equipe
            </AppText>
            <AppText className="text-base leading-relaxed text-text-main">{result.coachMessage}</AppText>
          </Animated.View>

          <DecisionCard icon={ListChecks} title="Treino" text={result.trainingDecision} />
          <DecisionCard icon={ForkKnife} title="Dieta" text={result.dietDecision} />

          <Animated.View
            entering={FadeInDown.delay(180).duration(420)}
            className="rounded-[24px] border border-border-subtle bg-bg-surface p-5"
          >
            <AppText className="text-[11px] font-bold uppercase tracking-[0.25em] text-text-muted mb-4">
              Próximos passos
            </AppText>
            <View className="gap-3">
              {result.nextSteps.map((step) => (
                <View key={step} className="flex-row items-start gap-3">
                  <CheckCircle color="#34D399" size={16} weight="fill" style={{ marginTop: 2 }} />
                  <AppText className="flex-1 text-sm leading-relaxed text-text-main">{step}</AppText>
                </View>
              ))}
            </View>
            <View className="mt-5 flex-row items-center gap-3 rounded-2xl bg-bg-base p-4">
              <CalendarCheck color="#A78BFA" size={20} weight="duotone" />
              <View className="flex-1">
                <AppText className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
                  Próxima reavaliação
                </AppText>
                <AppText className="mt-1 text-base font-bold text-text-main">{result.nextAssessmentAt}</AppText>
              </View>
            </View>
          </Animated.View>
        </View>
      ) : (
        <Animated.View
          entering={FadeInDown.delay(80).duration(420)}
          className="rounded-[24px] border border-brand-primary/25 bg-brand-primary/10 p-5"
        >
          <AppText className="text-base font-bold text-text-main">Equipe analisando</AppText>
          <AppText className="mt-2 text-sm leading-relaxed text-text-muted">
            Quando o parecer estiver concluído, você verá os ajustes de treino, dieta e orientações nesta página.
          </AppText>
        </Animated.View>
      )}
    </AppScreen>
  );
}

function DecisionCard({ icon: Icon, title, text }: { icon: typeof ListChecks; title: string; text: string }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(120).duration(420)}
      className="rounded-[24px] border border-border-subtle bg-bg-surface p-5"
    >
      <View className="mb-3 h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary/10">
        <Icon color="#A78BFA" size={20} weight="duotone" />
      </View>
      <AppText className="text-[11px] font-bold uppercase tracking-[0.25em] text-text-muted mb-1">{title}</AppText>
      <AppText className="text-base leading-relaxed text-text-main">{text}</AppText>
    </Animated.View>
  );
}
