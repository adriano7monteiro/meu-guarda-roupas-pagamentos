import Constants from 'expo-constants';

/**
 * Obtém a URL do backend de forma segura
 * Funciona em desenvolvimento e produção (EAS Build)
 */
export const getBackendUrl = (): string => {
  // 1. Tentar pegar do extra (configurado no app.config.js)
  const extraBackendUrl = Constants.expoConfig?.extra?.backendUrl;
  if (extraBackendUrl) {
    return extraBackendUrl;
  }

  // 2. Tentar pegar do process.env (funciona em desenvolvimento)
  const envBackendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envBackendUrl) {
    return envBackendUrl;
  }

  // 3. Fallback para URL de produção (nunca deve chegar aqui)
  console.warn('⚠️ Backend URL não encontrada! Usando fallback.');
  return 'https://meulookia-e68fc7ce1afa.herokuapp.com';
};

// Export como constante para uso direto
export const BACKEND_URL = getBackendUrl();

// Log para debug (remover em produção)
if (__DEV__) {
  console.log('🔧 Backend URL configurada:', BACKEND_URL);
  console.log('📦 Expo Config:', Constants.expoConfig?.extra);
}
