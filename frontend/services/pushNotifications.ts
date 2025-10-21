import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configurar como as notificações devem ser tratadas quando o app está em foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registra o dispositivo para receber notificações push
 * @returns Push token ou null se falhar
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  console.log('🔔 [Push] Iniciando configuração...');
  console.log('🔔 [Push] Platform:', Platform.OS);
  console.log('🔔 [Push] Is Device:', Device.isDevice);

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6c5ce7',
    });
    console.log('🔔 [Push] Canal de notificação Android configurado');
  }

  if (Device.isDevice) {
    console.log('🔔 [Push] Verificando permissões...');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('🔔 [Push] Status de permissão existente:', existingStatus);
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      console.log('🔔 [Push] Solicitando permissão...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('🔔 [Push] Nova permissão:', finalStatus);
    }
    
    if (finalStatus !== 'granted') {
      console.log('❌ [Push] Permissão de notificação negada');
      return null;
    }
    
    try {
      console.log('🔔 [Push] Obtendo Expo Push Token...');
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '48204880-bc16-43d4-98d3-88325a3d422c',
      });
      token = tokenData.data;
      console.log('✅ [Push] Push token obtido:', token);
    } catch (error) {
      console.error('❌ [Push] Erro ao obter push token:', error);
    }
  } else {
    console.log('⚠️ [Push] Notificações push só funcionam em dispositivos físicos');
  }

  return token;
}

/**
 * Adiciona listener para quando uma notificação é recebida enquanto o app está aberto
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Adiciona listener para quando o usuário toca em uma notificação
 */
export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Remove todos os listeners de notificação
 */
export function removeAllNotificationListeners() {
  Notifications.removeAllNotificationListeners();
}
