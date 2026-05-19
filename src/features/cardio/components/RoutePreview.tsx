import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { AppText } from '@/src/shared/components/ui/AppText';

interface RoutePreviewProps {
  color: string;
  rgb: string;
  label?: string;
  compact?: boolean;
}

export function RoutePreview({ color, rgb, label = 'Percurso sugerido', compact = false }: RoutePreviewProps) {
  return (
    <View
      style={{
        height: compact ? 112 : 164,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#0D1117',
        borderWidth: 1,
        borderColor: `rgba(${rgb}, 0.18)`,
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          opacity: 0.65,
        }}
      >
        {Array.from({ length: 7 }).map((_, index) => (
          <View
            key={`h-${index}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 18 + index * 22,
              height: 1,
              backgroundColor: `rgba(${rgb}, 0.055)`,
            }}
          />
        ))}
        {Array.from({ length: 8 }).map((_, index) => (
          <View
            key={`v-${index}`}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 18 + index * 42,
              width: 1,
              backgroundColor: `rgba(${rgb}, 0.055)`,
            }}
          />
        ))}
      </View>

      <Svg width="100%" height="100%" viewBox="0 0 340 164" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="routeStroke" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={`rgba(${rgb}, 0.55)`} />
            <Stop offset="1" stopColor={color} />
          </LinearGradient>
        </Defs>
        <Path
          d="M22 112 C58 54 88 54 122 82 C158 112 184 26 222 48 C258 68 268 122 318 52"
          fill="none"
          stroke={`rgba(${rgb}, 0.22)`}
          strokeWidth={12}
          strokeLinecap="round"
        />
        <Path
          d="M22 112 C58 54 88 54 122 82 C158 112 184 26 222 48 C258 68 268 122 318 52"
          fill="none"
          stroke="url(#routeStroke)"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <Circle cx={22} cy={112} r={6} fill="#22C55E" stroke="#FFFFFF" strokeWidth={2.5} />
        <Circle cx={318} cy={52} r={8} fill={color} stroke="#FFFFFF" strokeWidth={2.5} />
      </Svg>

      <View
        style={{
          position: 'absolute',
          left: 12,
          top: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 6,
          backgroundColor: 'rgba(0,0,0,0.48)',
        }}
      >
        <View style={{ width: 7, height: 7, borderRadius: 99, backgroundColor: color }} />
        <AppText
          className="text-[9px] font-bold uppercase"
          style={{ color, letterSpacing: 1.2 }}
        >
          {label}
        </AppText>
      </View>
    </View>
  );
}
