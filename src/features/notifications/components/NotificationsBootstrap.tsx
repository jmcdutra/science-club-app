import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useAuthStore } from '@/src/features/auth/services/auth.store';
import { registerDeviceToken } from '@/src/features/notifications/api/notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getProjectId() {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    undefined
  );
}

export function NotificationsBootstrap() {
  const { session } = useAuthStore();
  const queryClient = useQueryClient();
  const registeredPushTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const notificationSubscription = Notifications.addNotificationReceivedListener(() => {
      queryClient.invalidateQueries({ queryKey: ['app-notifications'] });
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(() => {
      queryClient.invalidateQueries({ queryKey: ['app-notifications'] });
    });

    return () => {
      notificationSubscription.remove();
      responseSubscription.remove();
    };
  }, [queryClient]);

  useEffect(() => {
    if (!session?.token) return;

    let cancelled = false;

    async function syncPushToken() {
      try {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
          });
        }

        const permissions = await Notifications.getPermissionsAsync();
        let finalStatus = permissions.status;

        if (finalStatus !== 'granted') {
          const requested = await Notifications.requestPermissionsAsync();
          finalStatus = requested.status;
        }

        if (finalStatus !== 'granted' || cancelled) {
          return;
        }

        const projectId = getProjectId();
        const tokenResponse = projectId
          ? await Notifications.getExpoPushTokenAsync({ projectId })
          : await Notifications.getExpoPushTokenAsync();

        if (!tokenResponse?.data || tokenResponse.data === registeredPushTokenRef.current || cancelled) {
          return;
        }

        await registerDeviceToken(session.token, {
          token: tokenResponse.data,
          platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'unknown',
        });

        registeredPushTokenRef.current = tokenResponse.data;
      } catch (error) {
        console.error('[NotificationsBootstrap] Falha ao registrar push token:', error);
      }
    }

    void syncPushToken();

    return () => {
      cancelled = true;
    };
  }, [session?.token]);

  return null;
}
