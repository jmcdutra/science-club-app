import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Barbell,
  Bell,
  CheckCircle,
  Drop,
  ForkKnife,
  X,
} from 'phosphor-react-native';
import { Pressable, ScrollView, View } from 'react-native';

import { useAuthStore } from '@/src/features/auth/services/auth.store';
import {
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AppNotification,
} from '@/src/features/notifications/api/notifications';
import { WorkoutNativeBottomSheetBase } from '@/src/features/workouts/components/WorkoutNativeBottomSheetBase';

import { AppText } from './AppText';

type Props = {
  visible: boolean;
  onClose: () => void;
};

function formatNotificationTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / (1000 * 60)));

  if (diffMinutes < 1) return 'Agora';
  if (diffMinutes < 60) return `${diffMinutes}min`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

function resolveNotificationAppearance(notification: AppNotification) {
  const source = `${notification.title} ${notification.description}`.toLowerCase();

  if (source.includes('treino')) {
    return {
      icon: <Barbell size={16} color="#A78BFA" weight="fill" />,
      iconBg: 'rgba(139,92,246,0.12)',
    };
  }

  if (source.includes('dieta') || source.includes('aliment')) {
    return {
      icon: <ForkKnife size={16} color="#F59E0B" weight="fill" />,
      iconBg: 'rgba(245,158,11,0.12)',
    };
  }

  if (source.includes('agua') || source.includes('hidrata')) {
    return {
      icon: <Drop size={16} color="#22D3EE" weight="fill" />,
      iconBg: 'rgba(34,211,238,0.12)',
    };
  }

  if (source.includes('avali') || source.includes('question')) {
    return {
      icon: <CheckCircle size={16} color="#22C55E" weight="fill" />,
      iconBg: 'rgba(34,197,94,0.12)',
    };
  }

  return {
    icon: <Bell size={16} color="#8B5CF6" weight="fill" />,
    iconBg: 'rgba(139,92,246,0.12)',
  };
}

export function NotificationsModal({ visible, onClose }: Props) {
  const { session } = useAuthStore();
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['app-notifications', session?.studentId],
    queryFn: () => getMyNotifications(session?.token!),
    enabled: visible && !!session?.token,
    refetchOnMount: 'always',
  });

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((item) => !item.read).length;

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationAsRead(session?.token!, notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(session?.token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-notifications'] });
    },
  });

  const handlePressNotification = (notification: AppNotification) => {
    if (!notification.read && !markAsReadMutation.isPending) {
      markAsReadMutation.mutate(notification._id);
    }
  };

  return (
    <WorkoutNativeBottomSheetBase
      visible={visible}
      onVisibleChange={(next) => !next && onClose()}
    >
      <View style={{ paddingTop: 36, paddingHorizontal: 24, paddingBottom: 8 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <AppText
              className="font-heading"
              style={{ fontSize: 22, fontWeight: '600', color: '#FFFFFF', letterSpacing: -0.5 }}
            >
              Notificações
            </AppText>
            <AppText style={{ fontSize: 12, color: '#666666', marginTop: 2 }}>
              {unreadCount > 0 ? `${unreadCount} não lidas` : 'Tudo em dia'}
            </AppText>
          </View>

          {notifications.length > 0 ? (
            <Pressable
              onPress={() => markAllAsReadMutation.mutate()}
              accessibilityRole="button"
              accessibilityLabel="Marcar notificações como lidas"
              style={{ marginRight: 10 }}
            >
              <AppText style={{ fontSize: 12, color: '#A78BFA', fontWeight: '600' }}>
                Ler todas
              </AppText>
            </Pressable>
          ) : null}

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            style={{
              width: 36,
              height: 36,
              borderRadius: 99,
              backgroundColor: '#1A1A1A',
              borderWidth: 1,
              borderColor: '#2A2A2A',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} color="#888888" weight="bold" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ maxHeight: 400 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}
        bounces={false}
      >
        {notificationsQuery.isLoading ? (
          <View style={{ paddingVertical: 36, alignItems: 'center' }}>
            <AppText style={{ fontSize: 13, color: '#666666' }}>Carregando notificações...</AppText>
          </View>
        ) : notifications.length === 0 ? (
          <View style={{ paddingVertical: 36, alignItems: 'center' }}>
            <AppText style={{ fontSize: 14, color: '#FFFFFF', fontWeight: '600' }}>
              Nenhuma notificação
            </AppText>
            <AppText style={{ fontSize: 12, color: '#666666', marginTop: 6 }}>
              Quando houver novidades, elas aparecem aqui.
            </AppText>
          </View>
        ) : (
          notifications.map((notification, index) => {
            const appearance = resolveNotificationAppearance(notification);

            return (
              <Pressable
                key={notification._id}
                onPress={() => handlePressNotification(notification)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 12,
                  paddingVertical: 14,
                  borderBottomWidth: index < notifications.length - 1 ? 1 : 0,
                  borderBottomColor: '#1A1A1A',
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: appearance.iconBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {appearance.icon}
                </View>

                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 3,
                    }}
                  >
                    <AppText
                      style={{
                        fontSize: 14,
                        fontWeight: notification.read ? '500' : '700',
                        color: notification.read ? '#AAAAAA' : '#FFFFFF',
                        flex: 1,
                        marginRight: 8,
                      }}
                      numberOfLines={1}
                    >
                      {notification.title}
                    </AppText>
                    <AppText style={{ fontSize: 11, color: '#555555' }}>
                      {formatNotificationTime(notification.created_at)}
                    </AppText>
                  </View>
                  <AppText
                    style={{
                      fontSize: 13,
                      color: notification.read ? '#555555' : '#888888',
                      lineHeight: 18,
                    }}
                  >
                    {notification.description}
                  </AppText>
                </View>

                {!notification.read ? (
                  <View
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 99,
                      backgroundColor: '#8B5CF6',
                      marginTop: 6,
                      flexShrink: 0,
                    }}
                  />
                ) : null}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </WorkoutNativeBottomSheetBase>
  );
}
