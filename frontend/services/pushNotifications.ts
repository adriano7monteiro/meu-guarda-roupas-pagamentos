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

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6c5ce7',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Permissão de notificação negada');
      return null;
    }
    
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '48204880-bc16-43d4-98d3-88325a3d422c',
      });
      token = tokenData.data;
      console.log('Push token obtido:', token);
    } catch (error) {
      console.error('Erro ao obter push token:', error);
    }
  } else {
    console.log('Notificações push só funcionam em dispositivos físicos');
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
