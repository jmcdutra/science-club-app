import { useEffect } from 'react';

// A implementação real com `expo-notifications` foi temporariamente desativada
// porque o módulo ainda está quebrando o runtime em alguns ambientes do app.
// Quando voltarmos a ativar push nativo, este componente deve retomar:
// - registro do token do dispositivo
// - listeners de recebimento/resposta
// - configuração do handler/canal do Expo Notifications
//
// Exemplo da base anterior, mantido em comentário para facilitar a retomada:
//
// import Constants from 'expo-constants';
// import * as Notifications from 'expo-notifications';
// import { useQueryClient } from '@tanstack/react-query';
// import { useRef } from 'react';
// import { Platform } from 'react-native';
// import { useAuthStore } from '@/src/features/auth/services/auth.store';
// import { registerDeviceToken } from '@/src/features/notifications/api/notifications';

export function NotificationsBootstrap() {
  useEffect(() => {
    // Push nativo via Expo Notifications: em desenvolvimento.
    // Por enquanto o app usa apenas notificações internas carregadas do backend.
  }, []);

  return null;
}
