import { Redirect } from 'expo-router';

import { useAuthStore } from '@/src/features/auth/services/auth.store';

export default function IndexRoute() {
  const session = useAuthStore((state) => state.session);

  if (session) {
    return <Redirect href="/(app)/(tabs)/home" />;
  }

  return <Redirect href="/(public)/login" />;
}
