import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';

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
export async function registerForPushNotificationsAsync() {
  let token = null;

  // Configurar canal de notificação para Android
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
    // iOS: Usar Firebase Messaging para obter token FCM válido
    if (Platform.OS === 'ios') {
      console.log('🍎 [Push iOS] Solicitando permissão de notificações...');
      
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('✅ [Push iOS] Permissão concedida! Status:', authStatus);
          console.log('🔔 [Push iOS] Obtendo FCM Token via Firebase...');
          
          token = await messaging().getToken();
          
          console.log('✅ [Push iOS] FCM Token obtido com sucesso via Firebase!');
          console.log('🔔 [Push iOS] Token type:', typeof token);
          console.log('🔔 [Push iOS] Token length:', token?.length);
          console.log('🔔 [Push iOS] Token preview:', token?.substring(0, 50) + '...');
        } else {
          console.log('❌ [Push iOS] Permissão NEGADA. Status:', authStatus);
          console.log('💡 [Push iOS] Vá em: Ajustes → Meu Look IA → Notificações → Ativar');
        }
      } catch (error) {
        console.error('❌ [Push iOS] Erro ao obter token Firebase:', error);
      }
    }
    // Android: Continuar usando Expo Notifications (já funciona)
    else if (Platform.OS === 'android') {
      console.log('🤖 [Push Android] Verificando permissões...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('🔔 [Push Android] Status de permissão existente:', existingStatus);
      let finalStatus = existingStatus;
      
      // SEMPRE solicita permissão, mesmo se status for 'undetermined'
      if (existingStatus !== 'granted') {
        console.log('🔔 [Push Android] Solicitando permissão de notificações...');
        console.log('⚠️ [Push Android] Se o dialog não aparecer, verifique as configurações');
        
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        
        console.log('🔔 [Push Android] Resposta da solicitação de permissão:', finalStatus);
      } else {
        console.log('✅ [Push Android] Permissão já concedida anteriormente');
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ [Push Android] Permissão de notificação NEGADA ou NÃO CONCEDIDA');
        console.log('❌ [Push Android] Status final:', finalStatus);
        console.log('💡 [Push Android] Vá em: Configurações → Apps → Meu Look IA → Notificações → Ativar');
        return null;
      }
      
      console.log('✅ [Push Android] Permissão concedida! Status:', finalStatus);
      
      try {
        console.log('🔔 [Push Android] Obtendo FCM Token nativo via Expo...');
        
        // Obter token FCM nativo (sem wrapper ExponentPushToken)
        const tokenData = await Notifications.getDevicePushTokenAsync();
        token = tokenData.data;
        
        console.log('✅ [Push Android] FCM Token obtido com sucesso!');
        console.log('🔔 [Push Android] Token type:', typeof token);
        console.log('🔔 [Push Android] Token length:', token?.length);
        console.log('🔔 [Push Android] Token preview:', token?.substring(0, 50) + '...');
      } catch (error) {
        console.error('❌ [Push Android] Erro ao obter token:', error);
      }
    }
  } else {
    console.log('⚠️ [Push] Deve ser executado em um dispositivo físico (não funciona no simulador/emulador)');
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
