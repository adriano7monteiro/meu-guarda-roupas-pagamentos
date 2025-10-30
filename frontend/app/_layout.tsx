import React, { useState, useEffect } from 'react';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import SplashScreen from '../components/SplashScreen';

// ✅ Importações do Analytics
import { analytics } from '../app/lib/firebase';
import { logEvent } from 'firebase/analytics';

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const path = usePathname(); // ex: "/", "/look/2", "/armario"

  // ✅ Quando a rota mudar → registra tela automaticamente
  useEffect(() => {
    if (analytics && path) {
      logEvent(analytics, 'screen_view', {
        screen_name: path,
        screen_class: path,
      });
    }
  }, [path]);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </>
  );
}
