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
      <Stack.Screen name="diet/plan" />
      <Stack.Screen name="diet/log" />
      <Stack.Screen name="diet/history" />
      <Stack.Screen name="diet/meals/[mealId]" />
      <Stack.Screen name="assessments/[assessmentId]" />
      <Stack.Screen name="assessments/[assessmentId]/questionnaire" />
      <Stack.Screen name="assessments/[assessmentId]/photos" />
      <Stack.Screen name="assessments/[assessmentId]/exams" />
      <Stack.Screen name="assessments/[assessmentId]/result" />
      <Stack.Screen name="profile/edit-contact" />
      <Stack.Screen name="profile/preferences" />
      <Stack.Screen name="profile/documents" />
      <Stack.Screen name="rankings/[rankingId]" />
      <Stack.Screen name="run/active" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="run/summary" options={{ animation: 'fade' }} />
    </Stack>
  );
}
