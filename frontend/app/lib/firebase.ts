import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ✅ Analytics NATIVO (não use firebase/analytics)
import analytics from '@react-native-firebase/analytics';
//import crashlytics from '@react-native-firebase/crashlytics';

const fb = Constants.expoConfig.extra.firebase;

const firebaseConfig = {
  apiKey: Platform.select({ ios: fb.ios.apiKey, android: fb.android.apiKey }),
  appId: Platform.select({ ios: fb.ios.appId, android: fb.android.appId }),
  projectId: fb.projectId,
  storageBucket: fb.storageBucket,
  messagingSenderId: fb.messagingSenderId,
  authDomain: fb.authDomain,
};

// Inicializa Firebase apenas 1 vez
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const storage = getStorage(app);

// ✅ Analytics nativo — funciona em iOS + Android
export const analyticsNativo = analytics();

// ✅ Crashlytics ativo
// export const crash = crashlytics();
// crash.setCrashlyticsCollectionEnabled(true);
