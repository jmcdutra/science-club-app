import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/src/shared/components/layout/FloatingTabBar';

export default function AppTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: true,
        freezeOnBlur: true,
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Início' }} />
      <Tabs.Screen name="workouts" options={{ title: 'Treinos' }} />
      <Tabs.Screen name="run" options={{ title: 'Run' }} />
      <Tabs.Screen name="diet" options={{ title: 'Dieta' }} />
      <Tabs.Screen name="more" options={{ title: 'Mais' }} />
      <Tabs.Screen name="ranking" options={{ title: 'Ranking', href: null }} />
      <Tabs.Screen name="assessments" options={{ title: 'Avaliação', href: null }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', href: null }} />
    </Tabs>
  );
}
