const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

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
      googleServicesFile: './GoogleService-Info.plist',
      infoPlist: {
      NSCameraUsageDescription: "O aplicativo precisa acessar sua câmera para tirar fotos dos suas roupas.",
      NSPhotoLibraryUsageDescription: "O aplicativo precisa acessar sua galeria para escolher fotos de roupas.",
    }
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
        projectId: '48204880-bc16-43d4-98d3-88325a3d422c',
      },
      // IMPORTANTE: Aqui é onde a variável do eas.json é injetada
      backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL || 'https://meulookia-e68fc7ce1afa.herokuapp.com',
      enableIAP: process.env.EXPO_PUBLIC_ENABLE_IAP === 'true',
    },
  },
};
