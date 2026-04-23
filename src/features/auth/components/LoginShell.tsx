import { CaretLeft } from 'phosphor-react-native';
import { PropsWithChildren } from 'react';
import { View, Pressable, Image } from 'react-native';

import { AppText } from '@/src/shared/components/ui/AppText';

type LoginShellProps = PropsWithChildren<{
  onBack?: () => void;
  showBackButton?: boolean;
}>;

import { useColorScheme } from 'nativewind';

export function LoginShell({ children, onBack, showBackButton }: LoginShellProps) {
  const { colorScheme } = useColorScheme();
  const isLight = colorScheme === 'light';

  const backgroundLogo = isLight 
    ? require('@/assets/images/brand/logo_d.png') 
    : require('@/assets/images/brand/logo_w.png');
    
  const headerLogo = isLight 
    ? require('@/assets/images/brand/logo_d.png') 
    : require('@/assets/images/brand/logo.png');

  return (
    <View className="flex-1 bg-bg-base">
      {/* Background Logo - Top Right adjusted */}
      <View className="absolute -right-40 -top-5 pointer-events-none">
        <Image 
          source={backgroundLogo} 
          style={{ width: 450, height: 450, opacity: isLight ? 0.06 : 0.03 }} 
          resizeMode="contain"
        />
      </View>

      {/* Header Minimalista */}
      <View className="px-6 pt-16 pb-12 flex-row items-center">
        {showBackButton && (
          <Pressable 
            onPress={onBack}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-bg-surface mr-4 border border-border-subtle"
          >
            <CaretLeft weight="bold" size={20} color={isLight ? "#000000" : "#FFFFFF"} />
          </Pressable>
        )}
        <View className="flex-row items-center gap-3">
          <Image 
             source={headerLogo} 
             style={{ width: 24, height: 24 }} 
             resizeMode="contain"
          />
          <AppText className="font-heading font-bold tracking-tighter text-text-main text-2xl uppercase">
            Science Club
          </AppText>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 px-6">
        {children}
      </View>
    </View>
  );
}
