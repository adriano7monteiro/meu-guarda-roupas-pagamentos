const fs = require('fs');
const path = require('path');

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

// Criar google-services.json dinamicamente se GOOGLE_SERVICES_JSON existir
// Isso permite usar EAS Secrets para o arquivo durante builds
if (process.env.GOOGLE_SERVICES_JSON) {
  const googleServicesPath = path.resolve(__dirname, 'google-services.json');
  try {
    // Parse o JSON para validar
    const googleServicesContent = JSON.parse(process.env.GOOGLE_SERVICES_JSON);
    // Escrever o arquivo
    fs.writeFileSync(googleServicesPath, JSON.stringify(googleServicesContent, null, 2));
    console.log('✅ google-services.json criado com sucesso via EAS Secret');
  } catch (error) {
    console.error('❌ Erro ao criar google-services.json:', error.message);
    // Durante build, se houver erro, o build deve falhar
    if (process.env.EAS_BUILD) {
      throw new Error('Failed to create google-services.json from EAS Secret');
    }
  }
} else if (process.env.EAS_BUILD) {
  // Durante EAS build, verificar se o arquivo existe localmente
  const googleServicesPath = path.resolve(__dirname, 'google-services.json');
  if (!fs.existsSync(googleServicesPath)) {
    console.warn('⚠️  google-services.json não encontrado. Configure GOOGLE_SERVICES_JSON no EAS Secret.');
    console.warn('    Execute: eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json');
  }
}

module.exports = {
  expo: {
    name: IS_DEV ? 'Meu Look IA (Dev)' : 'Meu Look IA',
    slug: 'meu-look-ia',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'meulookia',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    platforms: ['ios', 'android', 'web'],
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#6c5ce7',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.meulookia.app',
      icon: './assets/images/icon.png',
    },
    android: {
      icon: './assets/images/icon.png',
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#6c5ce7',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.meulookia.app',
      googleServicesFile: './google-services.json',
      permissions: [
        'POST_NOTIFICATIONS'
      ],
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-notifications',
        {
          icon: './assets/images/notification-icon.png',
          color: '#6c5ce7',
          sounds: [],
          androidMode: 'default',
          androidCollapsedTitle: '{{unread_count}} novas notificações'
        }
      ],
      [
        'expo-build-properties',
        {
          android: {
            minSdkVersion: 24,
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: '35.0.0',
            enableProguardInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
          },
          ios: {
            deploymentTarget: '15.1',
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: '84e4ed9c-089d-4e2e-9ab2-4c30b0456e75',
      },
      // IMPORTANTE: Aqui é onde a variável do eas.json é injetada
      backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL || 'https://meulookia-e68fc7ce1afa.herokuapp.com',
      enableIAP: process.env.EXPO_PUBLIC_ENABLE_IAP === 'true',
    },
  },
};
