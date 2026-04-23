import { IdentificationCard, CaretRight, UserCircle, Gear, FileText, SignOut } from 'phosphor-react-native';
import { router } from 'expo-router';
import { View, Pressable, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';

import { useAuthStore } from '@/src/features/auth/services/auth.store';
import { AppShell } from '@/src/shared/components/layout/AppShell';
import { AppText } from '@/src/shared/components/ui/AppText';

export function ProfileScreen() {
  const { colorScheme } = useColorScheme();
  const clearSession = useAuthStore((state) => state.clearSession);

  async function signOut() {
    await clearSession();
    router.replace('/(public)/login');
  }

  const isDark = colorScheme === 'dark';

  return (
    <AppShell greeting="Identificação" title="Sua Conta">
      
      {/* Client ID Block */}
      <Animated.View entering={FadeInDown.delay(200).duration(800)} className="mb-12">
        <View className="flex-row items-center gap-6 border-b border-border-subtle pb-10">
          <View className="w-28 h-28 rounded-full overflow-hidden border border-border-subtle bg-bg-surface p-1">
             <Image 
               source={{ uri: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Atleta' }} 
               className="w-full h-full rounded-full opacity-90" 
             />
          </View>
          <View>
            <View className="flex-row items-center gap-2 mb-3">
              <View className="w-2 h-2 rounded-full bg-brand-primary" />
              <AppText className="text-[11px] font-bold text-brand-primary uppercase tracking-widest">Plano Pro</AppText>
            </View>
            <AppText className="font-heading text-3xl font-bold text-text-main leading-[1.1] mb-2">João{'\n'}Silva</AppText>
            <AppText className="font-mono text-xs text-text-muted">ID: SC-240982</AppText>
          </View>
        </View>
      </Animated.View>

      <View className="space-y-12">
        {/* System section - Minimal */}
        <Animated.View entering={FadeInDown.delay(300).duration(800)}>
          <View className="flex-row items-end justify-between border-b border-border-subtle pb-3 mb-4">
            <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">Configurações</AppText>
          </View>
          
          <View className="flex-row items-center justify-between py-6 border-b border-border-subtle">
            <AppText className="font-medium text-base text-text-main">Notificações</AppText>
            <View className="flex-row items-center gap-2">
              <AppText className="text-xs font-bold text-text-muted uppercase tracking-widest">Ativas</AppText>
              <CaretRight size={16} color={isDark ? "#444444" : "#CCCCCC"} weight="bold" />
            </View>
          </View>

          <View className="flex-row items-center justify-between py-6 border-b border-border-subtle">
            <AppText className="font-medium text-base text-text-main">Privacidade</AppText>
            <CaretRight size={16} color={isDark ? "#444444" : "#CCCCCC"} weight="bold" />
          </View>
        </Animated.View>

        {/* General Management */}
        <Animated.View entering={FadeInDown.delay(400).duration(800)}>
          <View className="flex-row items-end justify-between border-b border-border-subtle pb-3 mb-4">
            <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">Gestão</AppText>
          </View>
          
          <Pressable className="flex-row items-center justify-between py-6 border-b border-border-subtle">
            <AppText className="font-medium text-base text-text-main">Preferências de Treino</AppText>
            <CaretRight size={18} color={isDark ? "#444444" : "#CCCCCC"} weight="bold" />
          </Pressable>

          <Pressable className="flex-row items-center justify-between py-6 border-b border-border-subtle">
            <AppText className="font-medium text-base text-text-main">Dados Médicos</AppText>
            <CaretRight size={18} color={isDark ? "#444444" : "#CCCCCC"} weight="bold" />
          </Pressable>
        </Animated.View>

        {/* Action Footer */}
        <Animated.View entering={FadeInDown.delay(500).duration(800)} className="pt-8 pb-20">
          <Pressable 
            onPress={signOut}
            className="w-full py-6 bg-red-500/5 border border-red-500/20 rounded-3xl items-center flex-row justify-center gap-3"
          >
            <SignOut size={20} color="#EF4444" weight="bold" />
            <AppText className="text-[11px] font-bold uppercase tracking-[0.3em] text-red-500">
              Desconectar
            </AppText>
          </Pressable>
        </Animated.View>
      </View>
    </AppShell>
  );
}

import { cn } from '@/src/shared/utils/cn';

