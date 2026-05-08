import {
  Barbell,
  Bell,
  CalendarCheck,
  ChatCircleText,
  ClipboardText,
  EnvelopeSimple,
  FileText,
  ForkKnife,
  Gear,
  Heartbeat,
  IdentificationCard,
  LockKey,
  Medal,
  Note,
  Phone,
  Ruler,
  Scales,
  ShieldCheck,
  SignOut,
  TrendUp,
  Trophy,
} from 'phosphor-react-native';
import { router, type Href } from 'expo-router';
import { Alert, Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuthStore } from '@/src/features/auth/services/auth.store';
import { AppShell } from '@/src/shared/components/layout/AppShell';
import { AppText } from '@/src/shared/components/ui/AppText';
import { useAppTheme } from '@/src/shared/theme/appTheme';
import { cn } from '@/src/shared/utils/cn';

import { ProfileActionRow } from '../components/ProfileActionRow';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { ProfileInfoRow } from '../components/ProfileInfoRow';
import { ProfileMetricCard } from '../components/ProfileMetricCard';
import { useProfileStore } from '../services/profile.store';
import { getProfileStatus } from '../utils';

export function ProfileDashboardScreen() {
  const { isDark } = useAppTheme();
  const profile = useProfileStore((state) => state.profile);
  const clearSession = useAuthStore((state) => state.clearSession);
  const status = getProfileStatus(profile.plan.status);

  const handleSignOut = () => {
    Alert.alert('Sair da conta', 'Deseja encerrar sua sessão neste aparelho?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await clearSession();
          router.replace('/(public)/login');
        },
      },
    ]);
  };

  const cellBg = isDark ? '#111111' : '#F5F5F5';
  const cellBorder = isDark ? '#1E1E1E' : '#EBEBEB';

  return (
    <AppShell
      title="Perfil"
      contentClassName="pb-36"
      rightAction={
        <Pressable
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-full bg-bg-surface border border-border-subtle"
          onPress={() => router.push('/(app)/profile/preferences' as Href)}
        >
          <Gear color="#A78BFA" size={20} weight="duotone" />
        </Pressable>
      }
    >
      {/* ─── HERO ─────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(80).duration(600)} className="mb-8">
        <View
          style={{
            borderRadius: 24,
            borderWidth: 1,
            borderColor: cellBorder,
            backgroundColor: cellBg,
            padding: 20,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 18, marginBottom: 20 }}>
            <ProfileAvatar name={profile.name} variant={profile.avatarVariant} />
            <View style={{ flex: 1, paddingTop: 4 }}>
              <View className={cn('mb-2 self-start rounded-full border px-3 py-1', status.bg, status.border)}>
                <AppText className={cn('text-[10px] font-bold uppercase tracking-wide', status.text)}>
                  {status.label}
                </AppText>
              </View>
              <AppText className="text-2xl font-bold leading-tight text-text-main">
                {profile.name}
              </AppText>
              <AppText className="mt-1 text-xs font-bold text-brand-secondary">
                {profile.id}
              </AppText>
              <AppText className="mt-1 text-sm text-text-muted">{profile.plan.name}</AppText>
            </View>
          </View>

          {/* Metric pills */}
          <View style={{ flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: isDark ? '#1E1E1E' : '#EBEBEB', paddingTop: 16 }}>
            <View style={{ flex: 1, backgroundColor: isDark ? '#161616' : '#EFEFEF', borderRadius: 16, padding: 14 }}>
              <CalendarCheck color="#A78BFA" size={18} weight="duotone" />
              <AppText className="mt-2.5 text-[11px] font-bold uppercase tracking-wide text-text-muted">
                Próxima reavaliação
              </AppText>
              <AppText className="mt-1 text-sm font-bold text-text-main">{profile.plan.nextCheckIn}</AppText>
            </View>
            <View style={{ flex: 1, backgroundColor: isDark ? '#161616' : '#EFEFEF', borderRadius: 16, padding: 14 }}>
              <Medal color="#A78BFA" size={18} weight="duotone" />
              <AppText className="mt-2.5 text-[11px] font-bold uppercase tracking-wide text-text-muted">
                Ciclo atual
              </AppText>
              <AppText className="mt-1 text-sm font-bold text-text-main">{profile.plan.mesocycle}</AppText>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* ─── CICLO ATUAL ──────────────────────── */}
      <Animated.View entering={FadeInDown.delay(140).duration(600)} className="mb-8">
        <View className="flex-row items-center justify-between border-b border-border-subtle pb-4 mb-4">
          <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">
            Ciclo Atual
          </AppText>
          <AppText className="text-xs text-text-muted">{profile.plan.objective}</AppText>
        </View>

        <View
          style={{ borderRadius: 20, borderWidth: 1, borderColor: cellBorder, backgroundColor: cellBg, padding: 16 }}
        >
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <PlanMiniCard icon={Barbell} label="Treino" value={profile.currentWorkout} />
            <PlanMiniCard icon={ForkKnife} label="Dieta" value={profile.currentDiet} />
          </View>
          <View className="gap-3">
            <ProfileInfoRow icon={Trophy} label="Objetivo" value={profile.plan.objective} />
            <ProfileInfoRow
              icon={CalendarCheck}
              label="Contrato"
              value={`${profile.plan.startDate} – ${profile.plan.renewalDate}`}
            />
          </View>
        </View>
      </Animated.View>

      {/* ─── RESUMO ───────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(180).duration(600)} className="mb-8">
        <View className="flex-row items-center justify-between border-b border-border-subtle pb-4 mb-4">
          <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">
            Desempenho
          </AppText>
          <AppText className="text-xs font-bold text-brand-secondary">
            {profile.metrics.adherence}% aderência
          </AppText>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <ProfileMetricCard
            caption="concluídos"
            icon={Barbell}
            label="treinos"
            value={String(profile.metrics.workoutsDone)}
          />
          <ProfileMetricCard
            caption="registradas"
            icon={ClipboardText}
            label="séries válidas"
            tone="success"
            value={String(profile.metrics.validSets)}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <ProfileMetricCard
            caption="último bloco"
            icon={TrendUp}
            label="volume"
            tone="neutral"
            value={profile.metrics.totalVolume}
          />
          <ProfileMetricCard
            caption="cargas/reps"
            icon={Trophy}
            label="progressões"
            tone="warning"
            value={String(profile.metrics.progressions)}
          />
        </View>
      </Animated.View>

      {/* ─── DADOS OFICIAIS ───────────────────── */}
      <Animated.View entering={FadeInDown.delay(220).duration(600)} className="mb-8">
        <View className="flex-row items-center border-b border-border-subtle pb-4 mb-4">
          <AppText className="flex-1 text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">
            Dados Físicos
          </AppText>
          <View className="rounded-full bg-brand-primary/10 px-3 py-1">
            <AppText className="text-[10px] font-bold text-brand-secondary uppercase tracking-wide">
              Somente leitura
            </AppText>
          </View>
        </View>

        <View style={{ borderRadius: 20, borderWidth: 1, borderColor: cellBorder, backgroundColor: cellBg, padding: 16 }}>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            <BodyMiniCard icon={Scales} label="Peso" value={`${profile.body.weightKg}kg`} />
            <BodyMiniCard icon={Ruler} label="Altura" value={`${profile.body.heightCm}cm`} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            <BodyMiniCard icon={Heartbeat} label="BF" value={`${profile.body.bodyFatPercent}%`} />
            <BodyMiniCard icon={IdentificationCard} label="Idade" value={`${profile.body.age} anos`} />
          </View>

          <ProfileInfoRow icon={Note} label="Observações" value={profile.observations} />

          {profile.restrictions.length > 0 && (
            <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {profile.restrictions.map((r) => (
                <View
                  key={r}
                  style={{
                    borderRadius: 99,
                    borderWidth: 1,
                    borderColor: isDark ? '#2A2A2A' : '#E0E0E0',
                    backgroundColor: isDark ? '#1A1A1A' : '#F0F0F0',
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                  }}
                >
                  <AppText className="text-xs font-bold text-text-muted">{r}</AppText>
                </View>
              ))}
            </View>
          )}
        </View>
      </Animated.View>

      {/* ─── CONTATO E CONTA ──────────────────── */}
      <Animated.View entering={FadeInDown.delay(260).duration(600)} className="mb-8">
        <View className="border-b border-border-subtle pb-4 mb-4">
          <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">
            Contato e Conta
          </AppText>
        </View>
        <View style={{ gap: 10 }}>
          <ProfileActionRow
            description={`${profile.phone} · ${profile.city}`}
            icon={Phone}
            title="Editar contato"
            onPress={() => router.push('/(app)/profile/edit-contact' as Href)}
          />
          <ProfileActionRow
            description={profile.email}
            icon={EnvelopeSimple}
            title="Email de acesso"
            value="fixo"
            onPress={() =>
              Alert.alert(
                'Email de acesso',
                'O email é o identificador da sua conta. Peça alteração ao suporte.',
              )
            }
          />
          <ProfileActionRow
            description="Notificações, privacidade e canal preferido."
            icon={LockKey}
            title="Preferências"
            onPress={() => router.push('/(app)/profile/preferences' as Href)}
          />
        </View>
      </Animated.View>

      {/* ─── EQUIPE ───────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(300).duration(600)} className="mb-8">
        <View className="border-b border-border-subtle pb-4 mb-4">
          <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">
            Equipe Science Club
          </AppText>
        </View>

        <View
          style={{ borderRadius: 20, borderWidth: 1, borderColor: cellBorder, backgroundColor: cellBg, padding: 16 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: '#8B5CF610',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck color="#A78BFA" size={24} weight="duotone" />
            </View>
            <View style={{ flex: 1 }}>
              <AppText className="text-base font-bold text-text-main">{profile.coach.name}</AppText>
              <AppText className="mt-0.5 text-sm text-text-muted">{profile.coach.responseTime}</AppText>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            style={{
              minHeight: 48,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: isDark ? '#2A2A2A' : '#E0E0E0',
              backgroundColor: isDark ? '#1A1A1A' : '#EFEFEF',
            }}
            onPress={() =>
              Alert.alert(
                'Em breve',
                'O chat com a equipe será integrado em uma próxima versão.',
              )
            }
          >
            <ChatCircleText color="#A78BFA" size={18} weight="duotone" />
            <AppText className="text-sm font-bold text-text-main">Enviar mensagem</AppText>
          </Pressable>
        </View>
      </Animated.View>

      {/* ─── DOCUMENTOS ───────────────────────── */}
      <Animated.View entering={FadeInDown.delay(340).duration(600)} className="mb-8">
        <View className="border-b border-border-subtle pb-4 mb-4">
          <AppText className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">
            Documentos e Suporte
          </AppText>
        </View>
        <View style={{ gap: 10 }}>
          <ProfileActionRow
            description="Contrato, plano, exames e termos vinculados."
            icon={FileText}
            title="Abrir documentos"
            value={`${profile.documents.length}`}
            onPress={() => router.push('/(app)/profile/documents' as Href)}
          />
          <ProfileActionRow
            description="Ajuda com acesso, plano ou dúvidas técnicas."
            icon={Bell}
            title="Suporte"
            onPress={() => Alert.alert('Suporte', 'Pedido de suporte registrado.')}
          />
          <ProfileActionRow
            destructive
            description="Encerrar sessão neste aparelho."
            icon={SignOut}
            title="Sair da conta"
            onPress={handleSignOut}
          />
        </View>
      </Animated.View>

      <AppText className="pb-3 text-center text-xs text-text-muted">Science Club App · v1.0.0</AppText>
    </AppShell>
  );
}

function PlanMiniCard({ icon: Icon, label, value }: { icon: typeof Barbell; label: string; value: string }) {
  return (
    <View className="flex-1 rounded-[18px] border border-border-subtle bg-bg-base p-3.5">
      <Icon color="#A78BFA" size={18} weight="duotone" />
      <AppText className="mt-2.5 text-[11px] font-bold uppercase tracking-wide text-text-muted">{label}</AppText>
      <AppText className="mt-1 text-sm font-bold leading-snug text-text-main">{value}</AppText>
    </View>
  );
}

function BodyMiniCard({ icon: Icon, label, value }: { icon: typeof Scales; label: string; value: string }) {
  return (
    <View className="flex-1 rounded-[18px] border border-border-subtle bg-bg-base p-3.5">
      <Icon color="#A78BFA" size={18} weight="duotone" />
      <AppText className="mt-2.5 text-[11px] font-bold uppercase tracking-wide text-text-muted">{label}</AppText>
      <AppText className="mt-1 text-xl font-bold text-text-main">{value}</AppText>
    </View>
  );
}
