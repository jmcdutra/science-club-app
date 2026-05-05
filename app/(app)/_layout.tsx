import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/src/features/auth/services/auth.store';

export default function AppLayout() {
  const session = useAuthStore((state) => state.session);

  if (!session) {
    return <Redirect href="/(public)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="workouts/[id]" />
      <Stack.Screen name="workouts/[id]/session" />
      <Stack.Screen name="workouts/[id]/finish" />
    </Stack>
  );
}
