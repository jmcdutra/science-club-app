import { Routes } from '@/src/shared/api/routes';

export type AppNotification = {
  _id: string;
  title: string;
  description: string;
  channel: 'app' | 'web' | 'both';
  status: 'sent' | 'scheduled';
  read: boolean;
  created_at: string;
};

export async function getMyNotifications(token: string) {
  return Routes.get<AppNotification[]>('/api/notifications/my', { token });
}

export async function markNotificationAsRead(token: string, id: string) {
  return Routes.patch<{ message: string }>(`/api/notifications/${id}/read`, {}, { token });
}

export async function markAllNotificationsAsRead(token: string) {
  return Routes.post<{ message: string }>('/api/notifications/read-all', {}, { token });
}

export async function registerDeviceToken(
  token: string,
  payload: { token: string; platform: 'ios' | 'android' | 'unknown' },
) {
  return Routes.post<{ message: string }>('/api/notifications/device-token', payload, { token });
}
