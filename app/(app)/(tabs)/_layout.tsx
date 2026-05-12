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
      <Tabs.Screen name="diet" options={{ title: 'Dieta' }} />
      <Tabs.Screen name="assessments" options={{ title: 'Avaliação' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
