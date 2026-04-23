import { House, Barbell, ForkKnife, ChartPieSlice, UserCircle } from 'phosphor-react-native';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { colors } from '@/src/shared/theme/tokens';

function TabIcon({ Icon, color, focused }: { Icon: any; color: string; focused: boolean }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.2 : 1, { damping: 15, stiffness: 200 });
  }, [focused, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={style}>
      <Icon color={color} size={24} weight={focused ? 'fill' : 'regular'} />
    </Animated.View>
  );
}

import { useColorScheme } from 'nativewind';

export default function AppTabsLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: true,
        freezeOnBlur: true,
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: isDark ? '#888888' : '#999999',
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: isDark ? '#111111' : '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#222222' : '#E5E7EB',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: Platform.OS === 'ios' ? 88 : 72,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          paddingTop: 12,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Início',
          tabBarIcon: (props) => <TabIcon Icon={House} {...props} />,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Treinos',
          tabBarIcon: (props) => <TabIcon Icon={Barbell} {...props} />,
        }}
      />
      <Tabs.Screen
        name="diet"
        options={{
          title: 'Dieta',
          tabBarIcon: (props) => <TabIcon Icon={ForkKnife} {...props} />,
        }}
      />
      <Tabs.Screen
        name="assessments"
        options={{
          title: 'Avaliações',
          tabBarIcon: (props) => <TabIcon Icon={ChartPieSlice} {...props} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: (props) => <TabIcon Icon={UserCircle} {...props} />,
        }}
      />
    </Tabs>
  );
}
