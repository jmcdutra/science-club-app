import { Barbell, CheckCircle, Drop, ForkKnife, X } from 'phosphor-react-native';
import { Pressable, ScrollView, View } from 'react-native';

import { WorkoutNativeBottomSheetBase } from '@/src/features/workouts/components/WorkoutNativeBottomSheetBase';
import { AppText } from './AppText';

type Notification = {
  id: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
};

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    icon: <Barbell size={16} color="#A78BFA" weight="fill" />,
    iconBg: 'rgba(139,92,246,0.12)',
    title: 'Treino de hoje liberado',
    body: 'Seu Treino B está disponível. Bora treinar!',
    time: 'Agora',
    read: false,
  },
  {
    id: '2',
    icon: <Drop size={16} color="#22D3EE" weight="fill" />,
    iconBg: 'rgba(34,211,238,0.12)',
    title: 'Meta de hidratação',
    body: 'Você já está em 2L de água hoje. Continue assim!',
    time: '14h32',
    read: false,
  },
  {
    id: '3',
    icon: <CheckCircle size={16} color="#22C55E" weight="fill" />,
    iconBg: 'rgba(34,197,94,0.12)',
    title: 'Avaliação em análise',
    body: 'Nossa equipe está analisando sua avaliação.',
    time: 'Ontem',
    read: true,
  },
  {
    id: '4',
    icon: <ForkKnife size={16} color="#F59E0B" weight="fill" />,
    iconBg: 'rgba(245,158,11,0.12)',
    title: 'Plano alimentar atualizado',
    body: 'Seu coach atualizou suas metas nutricionais.',
    time: '2 dias atrás',
    read: true,
  },
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function NotificationsModal({ visible, onClose }: Props) {
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <WorkoutNativeBottomSheetBase
      visible={visible}
      onVisibleChange={(next) => !next && onClose()}
    >
      {/* paddingTop deixa espaço para o handle bar (28px) do base component */}
      <View style={{ paddingTop: 36, paddingHorizontal: 24, paddingBottom: 8 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <View>
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
        {MOCK_NOTIFICATIONS.map((notif, index) => (
          <Pressable
            key={notif.id}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 12,
              paddingVertical: 14,
              borderBottomWidth: index < MOCK_NOTIFICATIONS.length - 1 ? 1 : 0,
              borderBottomColor: '#1A1A1A',
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: notif.iconBg,
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {notif.icon}
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
                    fontWeight: notif.read ? '500' : '700',
                    color: notif.read ? '#AAAAAA' : '#FFFFFF',
                    flex: 1,
                    marginRight: 8,
                  }}
                  numberOfLines={1}
                >
                  {notif.title}
                </AppText>
                <AppText style={{ fontSize: 11, color: '#555555' }}>{notif.time}</AppText>
              </View>
              <AppText
                style={{
                  fontSize: 13,
                  color: notif.read ? '#555555' : '#888888',
                  lineHeight: 18,
                }}
                numberOfLines={2}
              >
                {notif.body}
              </AppText>
            </View>

            {!notif.read && (
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
            )}
          </Pressable>
        ))}
      </ScrollView>
    </WorkoutNativeBottomSheetBase>
  );
}
