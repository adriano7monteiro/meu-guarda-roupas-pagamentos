import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

const fb = Constants.expoConfig.extra.firebase;

const firebaseConfig = {
  apiKey: Platform.select({ ios: fb.ios.apiKey, android: fb.android.apiKey }),
  appId: Platform.select({ ios: fb.ios.appId, android: fb.android.appId }),
  projectId: fb.projectId,
  storageBucket: fb.storageBucket,
  messagingSenderId: fb.messagingSenderId,
  authDomain: fb.authDomain,
  measurementId: fb.measurementId, // ✅ GA4 ativo no Expo
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const storage = getStorage(app);

export let analytics = null;
isSupported().then((supported) => {
  if (supported) analytics = getAnalytics(app);
});
