import { ArrowRight, CaretRight, ClipboardText, Clock, ForkKnife, Play } from 'phosphor-react-native';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';

import { AppShell } from '@/src/shared/components/layout/AppShell';
import { AppText } from '@/src/shared/components/ui/AppText';

export function HomeScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <AppShell greeting="Boa tarde" title="João Dutra" contentClassName="pb-32">
      
      {/* Extreme Priority Action */}
      <Animated.View 
        entering={FadeInDown.delay(200).duration(800)}
        className="mb-12"
      >
        <View className="bg-white rounded-[40px] p-8 min-h-[220px] justify-between relative overflow-hidden shadow-2xl shadow-black/10 border border-border-subtle">
          <View className="absolute -right-8 -bottom-8 opacity-[0.03]">
             <ClipboardText size={160} color="#000000" weight="fill" />
          </View>
          
          <View className="flex-row justify-between items-center z-10">
            <View className="bg-black/5 px-4 py-1.5 rounded-full border border-black/5">
              <AppText className="text-[11px] font-bold uppercase tracking-widest text-black/60">Ação Urgente</AppText>
            </View>
            <View className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
          </View>
          
          <View className="z-10 mt-6">
            <AppText className="text-base font-medium text-black/60 mb-1">Semana 4 de 4</AppText>
            <AppText className="font-heading text-4xl font-bold text-black leading-tight mb-6">
              Questionário{'\n'}Liberado
            </AppText>
            
            <Pressable className="bg-brand-primary self-start px-6 py-3 rounded-2xl flex-row items-center gap-2">
              <AppText className="text-white font-bold text-sm">Responder agora</AppText>
              <ArrowRight color="#FFFFFF" size={16} weight="bold" />
            </Pressable>
          </View>
        </View>
      </Animated.View>

      <View className="space-y-16">
        {/* Workout Section */}
        <Animated.View entering={FadeInDown.delay(400).duration(800)}>
          <View className="flex-row items-end justify-between border-b border-border-subtle pb-4 mb-8">
            <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">Treino do Dia</AppText>
            <View className="flex-row items-center gap-1.5">
              <Clock size={18} color={isDark ? "#FFFFFF" : "#000000"} />
              <AppText className="text-text-main font-semibold text-base">55m</AppText>
            </View>
          </View>
          
          <View className="flex-row items-center justify-between">
            <View>
              <AppText className="font-heading text-2xl font-bold text-text-main mb-1.5">Costas & Bíceps</AppText>
              <AppText className="text-base text-text-muted">6 Exercícios • Foco Extremo</AppText>
            </View>
            <Pressable className="w-16 h-16 rounded-full bg-brand-primary items-center justify-center shadow-lg shadow-brand-primary/40">
               <Play size={28} color="#FFFFFF" weight="fill" style={{ marginLeft: 4 }} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Diet Section */}
        <Animated.View entering={FadeInDown.delay(600).duration(800)}>
           <View className="flex-row items-end justify-between border-b border-border-subtle pb-4 mb-8 pt-4">
            <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">Próxima Refeição</AppText>
            <ForkKnife size={20} color={isDark ? "#888888" : "#666666"} />
          </View>
          
          <View className="flex-row items-center justify-between">
            <View>
               <AppText className="font-heading text-2xl font-bold text-text-main mb-1.5">Pós-Treino</AppText>
               <AppText className="text-base text-text-muted">Whey + Banana + Aveia</AppText>
            </View>
            <Pressable className="w-12 h-12 rounded-2xl bg-bg-surface border border-border-subtle items-center justify-center">
               <CaretRight size={20} color={isDark ? "#888888" : "#666666"} weight="bold" />
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </AppShell>
  );
}
