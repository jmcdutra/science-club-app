import Constants from 'expo-constants';
import { CheckCircle, Clock, Fire, Flame, Footprints, InstagramLogo, Lightning, TrendUp, Wind } from 'phosphor-react-native';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { WebView } from 'react-native-webview';

import { AppCard } from '@/src/shared/components/ui/AppCard';
import { AppButton } from '@/src/shared/components/ui/AppButton';
import { AppText } from '@/src/shared/components/ui/AppText';
import { getNativeShareModule } from '@/src/shared/utils/nativeShare';
import { useAuthStore } from '@/src/features/auth/services/auth.store';

import { deleteCardioActivity, saveCardioActivity, updateCardioActivity } from '../api/cardio';
import { CardioIcon } from '../components/CardioIcon';
import { useCardioStore } from '../stores/cardio.store';
import type { CardioEffort } from '../types';

function fmtTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function buildMapHtml(color: string, coords: { lat: number; lng: number }[]) {
  const json = JSON.stringify(coords.map(c => [c.lat, c.lng]));
  const mid = coords.length > 0 ? coords[Math.floor(coords.length / 2)] : { lat: -23.5875, lng: -46.6545 };
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body,#map{width:100%;height:100%;background:#0d1117}
    .leaflet-control-attribution,.leaflet-control-zoom{display:none!important}
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map=L.map('map',{zoomControl:false,attributionControl:false,dragging:true,preferCanvas:true})
      .setView([${mid.lat},${mid.lng}],15);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',{maxZoom:19,subdomains:'abcd'}).addTo(map);
    var coords=${json};
    if(coords.length>0){
      L.polyline(coords,{color:'${color}',weight:9,opacity:.18,lineCap:'round'}).addTo(map);
      L.polyline(coords,{color:'${color}',weight:4,opacity:.95,lineCap:'round'}).addTo(map);
      L.circleMarker(coords[0],{radius:5,fillColor:'#22C55E',color:'#fff',weight:2.5,fillOpacity:1}).addTo(map);
      L.circleMarker(coords[coords.length-1],{radius:7,fillColor:'${color}',color:'#fff',weight:2.5,fillOpacity:1}).addTo(map);
      try{map.fitBounds(L.polyline(coords).getBounds(),{padding:[36,36]})}catch(e){}
    }
  </script>
</body>
</html>`;
}

const EFFORT_OPTIONS: { value: CardioEffort; icon: typeof Wind; label: string }[] = [
  { value: 'easy', icon: Wind, label: 'Leve' },
  { value: 'good', icon: CheckCircle, label: 'Bom' },
  { value: 'hard', icon: Fire, label: 'Pesado' },
  { value: 'max', icon: Lightning, label: 'Máximo' },
];

export function RunSummaryScreen() {
  const insets = useSafeAreaInsets();
  const { session: authSession } = useAuthStore();
  const queryClient = useQueryClient();
  const composedShareRef = useRef<View>(null);

  const completedSession = useCardioStore(s => s.completedSession);
  const clearCompletedSession = useCardioStore(s => s.clearCompletedSession);

  const [effort, setEffort] = useState<CardioEffort | null>(null);
  const [notes, setNotes] = useState('');
  const [savedActivityId, setSavedActivityId] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<{ effort: CardioEffort | null; notes: string } | null>(null);
  const instagramStoriesAppId = Constants.expoConfig?.extra?.instagramStoriesAppId;
  const autoSaveAttemptedRef = useRef(false);
  const discardAfterSaveRef = useRef(false);

  const type = completedSession?.type;

  const mapHtml = useMemo(() => {
    if (!completedSession || !type) return '';
    return buildMapHtml(type.color, completedSession.coords);
  }, [completedSession, type]);

  const { mutateAsync: saveInitialActivity, isPending: isSavingInitial } = useMutation({
    mutationFn: () => {
      if (!authSession?.token || !completedSession) throw new Error('Sessão inválida');
      return saveCardioActivity(authSession.token, { ...completedSession, effort, notes });
    },
    onSuccess: async (activity) => {
      if (discardAfterSaveRef.current && authSession?.token) {
        try {
          await deleteCardioActivity(authSession.token, activity._id);
          queryClient.invalidateQueries({ queryKey: ['cardio-activities'] });
          queryClient.invalidateQueries({ queryKey: ['cardio-summary'] });
          clearCompletedSession();
          router.replace('/(app)/(tabs)/run' as any);
          return;
        } catch {
          discardAfterSaveRef.current = false;
        }
      }

      setSavedActivityId(activity._id);
      setSavedSnapshot({
        effort: activity.effort || null,
        notes: activity.notes || '',
      });
      queryClient.invalidateQueries({ queryKey: ['cardio-activities'] });
      queryClient.invalidateQueries({ queryKey: ['cardio-summary'] });
    },
    onError: (err: Error) => Alert.alert('Erro', err.message || 'Não foi possível registrar o cardio.'),
  });

  const { mutateAsync: updateSavedActivity, isPending: isUpdatingActivity } = useMutation({
    mutationFn: () => {
      if (!authSession?.token || !savedActivityId) throw new Error('Registro inválido');
      return updateCardioActivity(authSession.token, savedActivityId, { effort, notes });
    },
    onSuccess: (activity) => {
      setSavedSnapshot({
        effort: activity.effort || null,
        notes: activity.notes || '',
      });
      queryClient.invalidateQueries({ queryKey: ['cardio-activities'] });
      queryClient.invalidateQueries({ queryKey: ['cardio-summary'] });
    },
    onError: (err: Error) => Alert.alert('Erro', err.message || 'Não foi possível atualizar o cardio.'),
  });

  const { mutateAsync: removeSavedActivity, isPending: isDeletingActivity } = useMutation({
    mutationFn: () => {
      if (!authSession?.token || !savedActivityId) throw new Error('Registro inválido');
      return deleteCardioActivity(authSession.token, savedActivityId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cardio-activities'] });
      queryClient.invalidateQueries({ queryKey: ['cardio-summary'] });
    },
    onError: (err: Error) => Alert.alert('Erro', err.message || 'Não foi possível descartar o cardio.'),
  });

  const handleDiscard = useCallback(() => {
    const discard = async () => {
      try {
        if (isSavingInitial && !savedActivityId) {
          discardAfterSaveRef.current = true;
          return;
        }
        if (savedActivityId && authSession?.token) {
          await removeSavedActivity();
        }
        clearCompletedSession();
        router.replace('/(app)/(tabs)/run' as any);
      } catch {
        return;
      }
    };

    void discard();
  }, [authSession?.token, clearCompletedSession, isSavingInitial, removeSavedActivity, savedActivityId]);

  const handleBackToRun = useCallback(() => {
    clearCompletedSession();
    router.replace('/(app)/(tabs)/run' as any);
  }, [clearCompletedSession]);

  useEffect(() => {
    if (!completedSession || !authSession?.token || autoSaveAttemptedRef.current || savedActivityId) return;
    autoSaveAttemptedRef.current = true;
    void saveInitialActivity();
  }, [authSession?.token, completedSession, saveInitialActivity, savedActivityId]);

  const shareInstagramStories = useCallback(async () => {
    if (!completedSession || !type) return;

    const nativeShare = getNativeShareModule();
    if (!nativeShare?.shareSingle || !nativeShare?.Social?.INSTAGRAM_STORIES) {
      Alert.alert('Indisponível', 'Compartilhamento direto no Instagram requer build nativa.');
      return;
    }

    if (!instagramStoriesAppId) {
      Alert.alert('Configuração ausente', 'Configure expo.extra.instagramStoriesAppId para compartilhar nos Stories.');
      return;
    }

    try {
      const stickerPath = await captureRef(composedShareRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      await nativeShare.shareSingle({
        social: nativeShare.Social.INSTAGRAM_STORIES,
        appId: instagramStoriesAppId,
        stickerImage: stickerPath,
        backgroundTopColor: '#111111',
        backgroundBottomColor: type.color,
      });
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir o Instagram Stories.');
    }
  }, [completedSession, instagramStoriesAppId, type]);

  if (!completedSession || !type) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-base">
        <AppText className="text-text-muted">Sessão não encontrada.</AppText>
      </View>
    );
  }

  const hasUnsavedChanges = savedSnapshot
    ? savedSnapshot.effort !== effort || savedSnapshot.notes !== notes
    : false;

  const stats = [
    {
      label: 'Distância',
      value: `${completedSession.distanceKm.toFixed(2)}`,
      unit: 'km',
      icon: <TrendUp size={16} color={type.color} weight="bold" />,
      iconBg: `rgba(${type.rgb}, 0.15)`,
      iconColor: type.color,
    },
    {
      label: 'Duração',
      value: fmtTime(completedSession.elapsed),
      icon: <Clock size={16} color="#38BDF8" weight="bold" />,
      iconBg: 'rgba(56,189,248,0.15)',
      iconColor: '#38BDF8',
    },
    {
      label: 'Pausa',
      value: fmtTime(completedSession.pausedSeconds || 0),
      icon: <Clock size={16} color="#A1A1AA" weight="bold" />,
      iconBg: 'rgba(161,161,170,0.15)',
      iconColor: '#A1A1AA',
    },
    {
      label: type.id === 'bike' ? 'Velocidade' : 'Pace médio',
      value: type.id === 'bike' ? `${completedSession.avgSpeedKmh}` : completedSession.avgPace,
      unit: type.id === 'bike' ? 'km/h' : undefined,
      icon: <Lightning size={16} color="#F59E0B" weight="bold" />,
      iconBg: 'rgba(245,158,11,0.15)',
      iconColor: '#F59E0B',
    },
    {
      label: 'Calorias média',
      value: `${completedSession.calories}`,
      unit: 'kcal',
      icon: <Flame size={16} color="#FB7185" weight="bold" />,
      iconBg: 'rgba(251,113,133,0.15)',
      iconColor: '#FB7185',
    },
    {
      label: 'Passos médio',
      value: completedSession.steps.toLocaleString('pt-BR'),
      icon: <Footprints size={16} color="#22C55E" weight="bold" />,
      iconBg: 'rgba(34,197,94,0.15)',
      iconColor: '#22C55E',
    },
  ];

  return (
    <View className="flex-1 bg-bg-base">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ScrollView
          bounces
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        >
          <View
            className="border-b border-border-subtle px-6 pb-5 pt-4"
            style={{ backgroundColor: `rgba(${type.rgb}, 0.06)` }}
          >
            <View className="mb-4 flex-row items-center gap-3">
              <View
                className="h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: `rgba(${type.rgb}, 0.16)` }}
              >
                <CardioIcon name={type.icon} size={24} color={type.color} weight="bold" />
              </View>
              <View className="min-w-0 flex-1">
                <AppText className="font-heading text-[22px] font-bold text-text-main">
                  Atividade concluída
                </AppText>
                <AppText className="mt-1 text-[12px] text-text-muted">
                  {type.label} ·{' '}
                  {new Date(completedSession.startedAt).toLocaleDateString('pt-BR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </AppText>
              </View>
            </View>
            <View className="flex-row items-end gap-2">
              <AppText className="font-heading text-[46px] font-bold text-text-main">
                {completedSession.distanceKm.toFixed(2)}
              </AppText>
              <AppText className="mb-2 text-[12px] font-bold uppercase" style={{ color: type.color, letterSpacing: 1.6 }}>
                km registrados
              </AppText>
            </View>
          </View>

          <View ref={composedShareRef} collapsable={false} className="gap-4 px-6 pt-5">
            {/* ── Route map ──────────────────────────────────── */}
            <View
              style={{
                height: 170,
                borderRadius: 18,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: `rgba(${type.rgb}, 0.2)`,
              }}
            >
              {completedSession.coords.length > 0 ? (
                <WebView
                  source={{ html: mapHtml }}
                  style={{ flex: 1, backgroundColor: '#0d1117' }}
                  scrollEnabled={false}
                  javaScriptEnabled
                  cacheEnabled
                />
              ) : (
                <View className="flex-1 items-center justify-center bg-bg-surface">
                  <AppText className="text-[11px] text-text-muted">Sem dados de rota</AppText>
                </View>
              )}
            </View>

            {/* ── Stats grid ─────────────────────────────────── */}
            <View className="flex-row flex-wrap gap-2.5">
              {stats.map((s, i) => (
                <AppCard key={i} className="rounded-[18px] px-4 py-4" style={{ width: '47.5%', flexGrow: 1 }}>
                  <View
                    className="mb-3 h-8 w-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: s.iconBg }}
                  >
                    {s.icon}
                  </View>
                  <AppText className="text-[11px] font-medium text-text-muted">{s.label}</AppText>
                  <AppText
                    className="mt-1 font-sans text-[20px] font-bold leading-none text-text-main"
                    style={{ letterSpacing: -0.5 }}
                  >
                    {s.value}
                    {s.unit ? (
                      <AppText className="text-[11px] font-normal text-text-muted">
                        {' '}{s.unit}
                      </AppText>
                    ) : null}
                  </AppText>
                </AppCard>
              ))}
            </View>

            {/* ── Effort picker ──────────────────────────────── */}
            <View>
              <AppText className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.25em] text-text-muted">
                Como foi o esforço?
              </AppText>
              <View className="flex-row gap-2">
                {EFFORT_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  const isSelected = effort === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setEffort(opt.value)}
                      style={({ pressed }) => ({
                        flex: 1,
                        paddingVertical: 12,
                        paddingHorizontal: 4,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: isSelected ? type.color : '#222',
                        backgroundColor: isSelected ? `rgba(${type.rgb}, 0.12)` : '#111',
                        alignItems: 'center',
                        gap: 6,
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <Icon size={20} color={isSelected ? type.color : '#888'} weight="bold" />
                      <AppText
                        className="text-[10px] font-bold"
                        style={{ color: isSelected ? type.color : '#888' }}
                      >
                        {opt.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* ── Notes ─────────────────────────────────────── */}
            <View>
              <AppText className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-text-muted">
                Notas
              </AppText>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Como foi? Alguma observação..."
                placeholderTextColor="#555"
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: '#111',
                  borderWidth: 1,
                  borderColor: '#222',
                  borderRadius: 12,
                  padding: 12,
                  color: '#fff',
                  fontSize: 13,
                  lineHeight: 20,
                  textAlignVertical: 'top',
                }}
              />
            </View>

            <Pressable
              onPress={shareInstagramStories}
              className="min-h-[54px] flex-row items-center justify-center gap-2 rounded-[18px] border px-4"
              style={{
                backgroundColor: '#E11D48',
                borderColor: 'rgba(255,255,255,0.08)',
                shadowColor: 'rgba(225,29,72,0.32)',
                shadowOpacity: 1,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 12 },
                elevation: 10,
              }}
            >
              <InstagramLogo size={18} color="#FFFFFF" weight="bold" />
              <AppText className="text-[14px] font-bold text-white">
                Compartilhar no Instagram
              </AppText>
            </Pressable>

            <AppButton
              variant="primary"
              fullWidth
              onPress={handleBackToRun}
              className="h-[54px] rounded-[18px]"
            >
              Voltar
            </AppButton>

            <Pressable onPress={handleDiscard} disabled={isDeletingActivity} className="items-center py-1">
              <AppText className="text-[12px] text-text-muted">
                {isDeletingActivity ? 'Descartando...' : 'Descartar atividade'}
              </AppText>
            </Pressable>
          </View>
        </ScrollView>

        {hasUnsavedChanges ? (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              alignItems: 'center',
              paddingHorizontal: 22,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 16),
              borderTopWidth: 1,
              borderTopColor: '#222',
              backgroundColor: 'rgba(0,0,0,0.95)',
            }}
          >
            <View style={{ width: '90%' }}>
              <AppButton
                variant="primary"
                fullWidth
                loading={isUpdatingActivity}
                disabled={isUpdatingActivity}
                onPress={() => void updateSavedActivity()}
                leftIcon={<CheckCircle size={18} color="#FFFFFF" weight="fill" />}
                className="h-[56px] rounded-[18px]"
              >
                {isUpdatingActivity ? 'Enviando...' : 'Enviar informações'}
              </AppButton>
            </View>
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}
