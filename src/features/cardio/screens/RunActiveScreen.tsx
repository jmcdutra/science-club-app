import { CheckCircle, Clock, Fire, Footprints, Pause, Play, TrendUp, X } from 'phosphor-react-native';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { AppText } from '@/src/shared/components/ui/AppText';
import { CardioIcon } from '../components/CardioIcon';
import { useCardioStore } from '../stores/cardio.store';
import { CARDIO_TYPES, type CardioTypeConfig, type Coordinate } from '../types';

// ─── GPS simulation fallback (Parque do Ibirapuera, São Paulo) ───────────────
const BASE_LAT = -23.5875;
const BASE_LNG = -46.6545;

function simulateCoord(elapsed: number): Coordinate {
  const angle = ((elapsed % 720) / 720) * (2 * Math.PI);
  return {
    lat: BASE_LAT + Math.sin(angle) * 0.0025,
    lng: BASE_LNG + Math.cos(angle) * 0.004,
    timestamp: new Date().toISOString(),
  };
}

function haversineKm(a: Coordinate, b: Coordinate): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function calcPace(km: number, secs: number) {
  if (km < 0.01 || secs < 5) return '--:--/km';
  const s = secs / km;
  return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}/km`;
}

function fmtTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

const STEP_LENGTH_METERS = 0.78;
const MIN_MOVEMENT_DISTANCE_KM = 0.004;
const MAX_JUMP_DISTANCE_KM = 0.35;

// ─── Leaflet map (CartoDB Dark Matter) ──────────────────────────────────────
function buildMapHtml(color: string, centerLat: number, centerLng: number) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body,#map{width:100%;height:100%;background:#0d1117}
    .leaflet-control-attribution,.leaflet-control-zoom{display:none!important}
    @keyframes pulse{0%{transform:scale(1);opacity:.7}70%{transform:scale(2.4);opacity:0}100%{transform:scale(1);opacity:0}}
    .ring{position:absolute;width:22px;height:22px;border-radius:50%;background:${color};opacity:.35;animation:pulse 1.8s ease-out infinite;top:-4px;left:-4px}
    .dot{width:14px;height:14px;border-radius:50%;background:${color};border:2.5px solid #fff;position:relative;z-index:1;box-shadow:0 1px 6px rgba(0,0,0,.5)}
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map=L.map('map',{zoomControl:false,attributionControl:false,preferCanvas:true})
      .setView([${centerLat},${centerLng}],16);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',{maxZoom:19,subdomains:'abcd'}).addTo(map);
    var segments=[[]];
    var glow=L.polyline([],{color:'${color}',weight:9,opacity:.18,lineCap:'round'}).addTo(map);
    var line=L.polyline([],{color:'${color}',weight:4,opacity:.95,lineCap:'round'}).addTo(map);
    var startDot=null,liveMarker=null;
    var liveIcon=L.divIcon({html:'<div style="width:14px;height:14px;position:relative;display:flex;align-items:center;justify-content:center"><div class="ring"></div><div class="dot"></div></div>',className:'',iconSize:[14,14],iconAnchor:[7,7]});
    function syncLines(){
      line.setLatLngs(segments.filter(function(segment){return segment.length>0;}));
      glow.setLatLngs(segments.filter(function(segment){return segment.length>0;}));
    }
    window.startPauseGap=function(){
      if(segments[segments.length-1].length>0){segments.push([])}
    };
    window.addCoord=function(lat,lng){
      if(!segments.length){segments=[[]]}
      segments[segments.length-1].push([lat,lng]);
      syncLines();
      var flattened=segments.flat();
      if(flattened.length===1){startDot=L.circleMarker([lat,lng],{radius:5,fillColor:'#22C55E',color:'#fff',weight:2.5,fillOpacity:1}).addTo(map)}
      if(liveMarker)map.removeLayer(liveMarker);
      liveMarker=L.marker([lat,lng],{icon:liveIcon,zIndexOffset:1000}).addTo(map);
      try{if(flattened.length>2){map.fitBounds(line.getBounds(),{padding:[44,44],animate:true,duration:.6,maxZoom:17})}else{map.setView([lat,lng],16,{animate:true,duration:.5})}}catch(e){}
    };
  </script>
</body>
</html>`;
}

// ─── Main component ──────────────────────────────────────────────────────────
export function RunActiveScreen() {
  const { type: typeId } = useLocalSearchParams<{ type: string }>();
  const insets = useSafeAreaInsets();
  const setCompletedSession = useCardioStore(s => s.setCompletedSession);

  const type: CardioTypeConfig = useMemo(
    () => CARDIO_TYPES.find(t => t.id === typeId) ?? CARDIO_TYPES[0],
    [typeId],
  );

  const [elapsed, setElapsed] = useState(0);
  const [pausedSeconds, setPausedSeconds] = useState(0);
  const [running, setRunning] = useState(true);
  const [showStop, setShowStop] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // map center — updated when first GPS fix arrives
  const [mapCenter, setMapCenter] = useState({ lat: BASE_LAT, lng: BASE_LNG });
  const mapCenterSetRef = useRef(false);

  // Mutable refs — avoids re-renders on every GPS tick
  const coordsRef    = useRef<Coordinate[]>([]);
  const distRef      = useRef(0);
  const calsRef      = useRef(0);
  const startedAtRef = useRef(new Date().toISOString());
  const elapsedRef   = useRef(0);
  const pausedSecondsRef = useRef(0);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const webViewRef   = useRef<WebView>(null);
  const runningRef   = useRef(true);
  const usingSimRef  = useRef(false); // true when GPS permission denied
  const lastTrackedCoordRef = useRef<Coordinate | null>(null);
  const ignoreNextCoordRef = useRef(false);
  const latestPreviewCoordRef = useRef<Coordinate | null>(null);

  // keep runningRef in sync so GPS callback can check it
  useEffect(() => { runningRef.current = running; }, [running]);

  // Display metrics
  const [displayKm,    setDisplayKm]    = useState(0);
  const [displayKcal,  setDisplayKcal]  = useState(0);
  const [displayPace,  setDisplayPace]  = useState('--:--/km');
  const [displaySpeed, setDisplaySpeed] = useState(0);
  const [displaySteps, setDisplaySteps] = useState(0);

  const mapHtml = useMemo(
    () => buildMapHtml(type.color, mapCenter.lat, mapCenter.lng),
    [type.color, mapCenter],
  );

  const pushCoordToMap = useCallback((coord: Coordinate) => {
    latestPreviewCoordRef.current = coord;
    if (mapReady) {
      webViewRef.current?.injectJavaScript(`window.addCoord(${coord.lat},${coord.lng});true;`);
    }
  }, [mapReady]);

  useEffect(() => {
    if (!mapReady || !latestPreviewCoordRef.current) return;
    const coord = latestPreviewCoordRef.current;
    webViewRef.current?.injectJavaScript(`window.addCoord(${coord.lat},${coord.lng});true;`);
  }, [mapReady]);

  const registerTrackedCoord = useCallback((coord: Coordinate) => {
    if (!mapCenterSetRef.current) {
      mapCenterSetRef.current = true;
      setMapCenter({ lat: coord.lat, lng: coord.lng });
    }

    if (ignoreNextCoordRef.current) {
      ignoreNextCoordRef.current = false;
      lastTrackedCoordRef.current = coord;
      coordsRef.current = [...coordsRef.current, coord];
      pushCoordToMap(coord);
      return;
    }

    const previousTracked = lastTrackedCoordRef.current;
    if (!previousTracked) {
      lastTrackedCoordRef.current = coord;
      coordsRef.current = [...coordsRef.current, coord];
      pushCoordToMap(coord);
      return;
    }

    const d = haversineKm(previousTracked, coord);
    if (d < MIN_MOVEMENT_DISTANCE_KM || d > MAX_JUMP_DISTANCE_KM) {
      return;
    }

    distRef.current += d;
    lastTrackedCoordRef.current = coord;
    coordsRef.current = [...coordsRef.current, coord];
    pushCoordToMap(coord);
  }, [pushCoordToMap]);

  // ── Real GPS setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        usingSimRef.current = true;
        return;
      }

      try {
        const lastKnown = await Location.getLastKnownPositionAsync({
          maxAge: 1000 * 60 * 5,
          requiredAccuracy: 250,
        });
        if (lastKnown && !mapCenterSetRef.current) {
          mapCenterSetRef.current = true;
          setMapCenter({ lat: lastKnown.coords.latitude, lng: lastKnown.coords.longitude });
          pushCoordToMap({
            lat: lastKnown.coords.latitude,
            lng: lastKnown.coords.longitude,
            timestamp: new Date(lastKnown.timestamp).toISOString(),
          });
        }
      } catch {
        // ignore and wait for live coordinates
      }

      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 3,
          timeInterval: 1000,
        },
        (position) => {
          if (!runningRef.current) return;

          const coord: Coordinate = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date(position.timestamp).toISOString(),
          };
          registerTrackedCoord(coord);
        },
      );

      try {
        const initial = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          maximumAge: 15000,
        });
        registerTrackedCoord({
          lat: initial.coords.latitude,
          lng: initial.coords.longitude,
          timestamp: new Date(initial.timestamp).toISOString(),
        });
      } catch {
        // if the first live fix delays, we still show the last known center immediately
      }
    })();

    return () => { sub?.remove(); };
  }, [pushCoordToMap, registerTrackedCoord]);

  // ── Timer tick (drives elapsed + display metrics + simulation fallback) ────
  const tick = useCallback(() => {
    if (runningRef.current) {
      const next = (elapsedRef.current += 1);
      setElapsed(next);

      // simulation fallback when GPS permission denied
      if (usingSimRef.current) {
        const coord = simulateCoord(next);
        const previousTracked = lastTrackedCoordRef.current;
        if (previousTracked) {
          const delta = haversineKm(previousTracked, coord);
          if (delta >= MIN_MOVEMENT_DISTANCE_KM && delta <= MAX_JUMP_DISTANCE_KM) {
            distRef.current += delta;
            coordsRef.current = [...coordsRef.current, coord];
            if (next % 2 === 0) {
              pushCoordToMap(coord);
            }
          }
        } else {
          coordsRef.current = [...coordsRef.current, coord];
          if (next % 2 === 0) {
            pushCoordToMap(coord);
          }
        }
        lastTrackedCoordRef.current = coord;
      }

      calsRef.current = Math.round(distRef.current * 63);

      setDisplayKm(Math.round(distRef.current * 100) / 100);
      setDisplayKcal(calsRef.current);
      setDisplayPace(calcPace(distRef.current, next));
      setDisplaySpeed(Math.round((distRef.current / Math.max(next, 1)) * 3600 * 10) / 10);
      setDisplaySteps(type.id === 'bike' ? 0 : Math.round((distRef.current * 1000) / STEP_LENGTH_METERS));
      return;
    }

    const nextPaused = pausedSecondsRef.current + 1;
    pausedSecondsRef.current = nextPaused;
    setPausedSeconds(nextPaused);
  }, [pushCoordToMap, type.id]);

  useEffect(() => {
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [tick]);

  const toggleRunning = useCallback(() => {
    setRunning((current) => {
      const next = !current;
      runningRef.current = next;
      if (next) {
        ignoreNextCoordRef.current = true;
        lastTrackedCoordRef.current = null;
        webViewRef.current?.injectJavaScript('window.startPauseGap && window.startPauseGap();true;');
      }
      return next;
    });
  }, []);

  const handleFinish = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRunning(false);
    runningRef.current = false;
    const el = elapsedRef.current;
    setCompletedSession({
      type,
      coords: coordsRef.current.filter((_, i) => i % 2 === 0),
      elapsed: el,
      pausedSeconds: pausedSecondsRef.current,
      distanceKm: distRef.current,
      calories: calsRef.current,
      avgPace: calcPace(distRef.current, el),
      avgSpeedKmh: Math.round((distRef.current / el) * 3600 * 10) / 10,
      avgHr: 0,
      maxHr: 0,
      steps: displaySteps,
      startedAt: startedAtRef.current,
      finishedAt: new Date().toISOString(),
      effort: null,
      notes: '',
    });
    router.replace('/(app)/run/summary' as any);
  }, [displaySteps, type, setCompletedSession]);

  const primaryMetric = displayKm.toFixed(2);

  const speedVal = type.id === 'bike'
    ? `${displaySpeed} km/h`
    : displayPace;

  return (
    <View style={{ flex: 1, backgroundColor: '#050507' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={{ flex: 1 }}>
          <View
            style={{
              height: '55%',
              minHeight: 330,
              overflow: 'hidden',
              borderBottomLeftRadius: 30,
              borderBottomRightRadius: 30,
              borderBottomWidth: 1,
              borderColor: `rgba(${type.rgb}, 0.2)`,
              backgroundColor: '#0d1117',
            }}
          >
            <WebView
              ref={webViewRef}
              source={{ html: mapHtml }}
              style={{ flex: 1, backgroundColor: '#0d1117' }}
              scrollEnabled={false}
              javaScriptEnabled
              allowsInlineMediaPlayback={false}
              mediaPlaybackRequiresUserAction
              onLoad={() => setMapReady(true)}
              cacheEnabled
            />
            {!mapReady ? (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: '#0d1117',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppText className="text-[10px] font-bold uppercase text-text-muted" style={{ letterSpacing: 2 }}>
                  Carregando mapa
                </AppText>
              </View>
            ) : null}

            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.08)',
              }}
            />

            <View
              style={{
                position: 'absolute',
                top: 12,
                left: 18,
                right: 18,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Pressable
                onPress={() => setShowStop(true)}
                style={({ pressed }) => ({
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  backgroundColor: 'rgba(0,0,0,0.56)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.16)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <X size={15} color="#FFFFFF" weight="bold" />
              </Pressable>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 7,
                  borderRadius: 999,
                  backgroundColor: 'rgba(0,0,0,0.58)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.12)',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <View style={{ width: 7, height: 7, borderRadius: 99, backgroundColor: running ? type.color : '#71717A' }} />
                <AppText className="text-[10px] font-bold uppercase" style={{ color: running ? type.color : '#A1A1AA', letterSpacing: 1.6 }}>
                  {running ? type.label : 'Pausado'}
                </AppText>
              </View>
            </View>

            <View
              style={{
                position: 'absolute',
                left: 18,
                right: 18,
                bottom: 18,
                borderRadius: 24,
                backgroundColor: 'rgba(5,5,7,0.82)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.14)',
                padding: 16,
              }}
            >
              <View className="flex-row items-start justify-between">
                <View>
                  <View className="mb-2 flex-row items-center gap-2">
                    <View className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: `rgba(${type.rgb}, 0.16)` }}>
                      <CardioIcon name={type.icon} size={17} color={type.color} weight="bold" />
                    </View>
                    <AppText className="text-[12px] font-bold uppercase text-text-muted" style={{ letterSpacing: 1.2 }}>
                      {type.label}
                    </AppText>
                  </View>
                  <View className="flex-row items-end gap-2">
                    <AppText className="font-heading text-[58px] font-bold text-white" style={{ lineHeight: 62 }}>
                      {primaryMetric}
                    </AppText>
                    <AppText className="mb-2 text-[11px] font-bold uppercase" style={{ color: type.color, letterSpacing: 1.6 }}>
                      {type.primaryMetricLabel}
                    </AppText>
                  </View>
                </View>
                <View className="items-end">
                  <Clock size={17} color="#A1A1AA" weight="bold" />
                  <AppText className="mt-1 text-[26px] font-bold text-white">{fmtTime(elapsed)}</AppText>
                </View>
              </View>
            </View>
          </View>

          <View style={{ flex: 1, paddingHorizontal: 18, paddingTop: 14 }}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              {[
                { label: type.speedLabel, value: speedVal, color: type.color, icon: TrendUp },
                { label: 'Passos', value: displaySteps.toLocaleString('pt-BR'), color: '#22C55E', icon: Footprints },
                { label: 'Kcal média', value: `${displayKcal} kcal`, color: '#F59E0B', icon: Fire },
              ].map(metric => {
                const Icon = metric.icon;
                return (
                  <View
                    key={metric.label}
                    style={{
                      flex: 1,
                      minHeight: 78,
                      borderRadius: 17,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.08)',
                      backgroundColor: 'rgba(255,255,255,0.045)',
                      paddingHorizontal: 10,
                      paddingVertical: 11,
                    }}
                  >
                    <Icon size={16} color={metric.color} weight="bold" />
                    <AppText className="mt-2 text-[13px] font-bold text-white" numberOfLines={1}>
                      {metric.value}
                    </AppText>
                    <AppText className="mt-0.5 text-[9px] font-semibold uppercase text-text-muted" style={{ letterSpacing: 0.5 }} numberOfLines={1}>
                      {metric.label}
                    </AppText>
                  </View>
                );
              })}
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 9,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
                backgroundColor: 'rgba(255,255,255,0.045)',
                paddingHorizontal: 13,
                paddingVertical: 12,
              }}
            >
              <View style={{ width: 9, height: 9, borderRadius: 99, backgroundColor: type.color }} />
              <AppText className="text-[12px] font-bold" style={{ color: type.color }}>
                {running ? 'Sessão em andamento' : 'Sessão pausada'}
              </AppText>
              <AppText className="text-[12px] text-text-muted">
                {running ? 'Continue para registrar o cardio' : `Pausa em ${fmtTime(pausedSeconds)}`}
              </AppText>
            </View>
          </View>

          <View
            style={{
              paddingHorizontal: 18,
              paddingBottom: Math.max(insets.bottom, 14),
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
            }}
          >
            <Pressable
              onPress={toggleRunning}
              style={({ pressed }) => ({
                width: 64,
                height: 64,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.14)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.72 : 1,
              })}
            >
              {running ? (
                <Pause size={23} color="#FFFFFF" weight="fill" />
              ) : (
                <Play size={23} color={type.color} weight="fill" />
              )}
            </Pressable>

            <Pressable
              onPress={handleFinish}
              style={({ pressed }) => ({
                minWidth: 142,
                height: 64,
                borderRadius: 999,
                backgroundColor: type.color,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                opacity: pressed ? 0.82 : 1,
              })}
            >
              <CheckCircle size={21} color="#FFFFFF" weight="fill" />
              <AppText className="text-[14px] font-bold text-white">Encerrar</AppText>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Stop confirmation ──────────────────────────────────── */}
      <Modal visible={showStop} transparent animationType="fade" onRequestClose={() => setShowStop(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.75)' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowStop(false)} />
          <View
            style={{
              backgroundColor: '#101010',
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
              paddingHorizontal: 22,
              paddingTop: 14,
              paddingBottom: Math.max(insets.bottom + 12, 32),
              borderTopWidth: 1,
              borderColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{ width: 44, height: 5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 18 }} />
              <AppText
                className="font-heading text-[20px] font-bold text-text-main"
                style={{ letterSpacing: -0.3, marginBottom: 6 }}
              >
                Parar atividade?
              </AppText>
              <AppText className="text-center text-[13px] text-text-muted">
                {fmtTime(elapsed)} ativos · {fmtTime(pausedSeconds)} em pausa · {displayKm.toFixed(2)} km
              </AppText>
            </View>
            <View style={{ gap: 10 }}>
              <Pressable
                onPress={() => { setShowStop(false); handleFinish(); }}
                style={({ pressed }) => ({
                  paddingVertical: 15,
                  borderRadius: 14,
                  backgroundColor: '#EF4444',
                  alignItems: 'center',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <AppText className="text-[15px] font-bold text-white">Encerrar atividade</AppText>
              </Pressable>
              <Pressable
                onPress={() => setShowStop(false)}
                style={({ pressed }) => ({
                  paddingVertical: 15,
                  borderRadius: 14,
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  alignItems: 'center',
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <AppText className="text-[15px] font-semibold text-white">Continuar</AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
