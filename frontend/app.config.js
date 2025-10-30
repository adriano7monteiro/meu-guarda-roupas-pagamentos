const IS_DEV = process.env.APP_VARIANT === 'development';

module.exports = {
  expo: {
    name: IS_DEV ? 'Meu Look IA (Dev)' : 'Meu Look IA',
    slug: 'meu-look-ia',
    version: '1.0.1',
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
      buildNumber: "115",
      infoPlist: {
        NSCameraUsageDescription: "O aplicativo precisa acessar sua câmera para tirar fotos das suas roupas.",
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

      // ✅ ADICIONADO - necessário para analytics funcionar
      '@react-native-firebase/analytics'
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
      ]
    ],

    experiments: {
      typedRoutes: true,
    },

    extra: {
      router: {},
      eas: {
        projectId: '48204880-bc16-43d4-98d3-88325a3d422c',
      },

      backendUrl: 'https://meulookia-e68fc7ce1afa.herokuapp.com',
      enableIAP: false,

      firebase: {
        android: {
          apiKey: "AIzaSyDLIY57I3SY_giqarTlntwDBHsv1yc_uQ0",
          appId: "1:608023360247:android:553b102ce491475917d9f2",
        },
        ios: {
          apiKey: "AIzaSyAC6Fyq4CNgKqFE4A59CIHkIQR2WBmnDck",
          appId: "1:608023360247:ios:4f3078a25bad59f617d9f2",
        },
        projectId: "meu-look-ia",
        authDomain: "meu-look-ia.firebaseapp.com",
        storageBucket: "meu-look-ia.firebasestorage.app",
        messagingSenderId: "608023360247",
        measurementId: "G-JY34083XGL"
      },
    },
  },
};
