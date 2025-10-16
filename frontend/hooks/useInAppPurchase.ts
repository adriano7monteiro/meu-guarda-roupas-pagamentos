import { useEffect, useState } from 'react';
import { BACKEND_URL } from '../config/api';
import { Platform } from 'react-native';
import { BACKEND_URL } from '../config/api';
import Constants from 'expo-constants';
import { BACKEND_URL } from '../config/api';

// IDs dos produtos no Google Play Console (você precisará criar esses IDs lá)
const SUBSCRIPTION_SKUS = Platform.select({
  android: ['mensal', 'semestral', 'anual'],
  ios: ['mensal', 'semestral', 'anual'],
  default: [],
});

export interface PurchaseState {
  subscriptions: any[];
  loading: boolean;
  purchasing: boolean;
  error: string | null;
}

export const useInAppPurchase = () => {
  const [state, setState] = useState<PurchaseState>({
    subscriptions: [],
    loading: true,
    purchasing: false,
    error: null,
  });

  useEffect(() => {
    // 🚫 DESABILITAR IAP EM EMULADOR/WEB/EXPO GO
    const isEmulator = Constants.isDevice === false;
    const isWeb = Platform.OS === 'web';
    
    if (isEmulator || isWeb) {
      console.log('⚠️ IAP desabilitado: Emulador/Web/Expo Go detectado');
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'IAP não disponível em emulador. Use dispositivo físico.' 
      }));
      return;
    }

    let purchaseUpdateSubscription: any;
    let purchaseErrorSubscription: any;

    const initIAP = async () => {
      try {
        // Import dinâmico da biblioteca apenas em dispositivos físicos
        const RNIap = await import('react-native-iap');
        
        await RNIap.initConnection();
        console.log('✅ IAP Connection initialized');
        
        await loadSubscriptions();

        // Listener para atualizações de compra
        purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(async (purchase: any) => {
          console.log('📦 Purchase updated:', purchase);
          
          const receipt = purchase.transactionReceipt;
          if (receipt) {
            try {
              // Enviar recibo para backend validar
              await verifyPurchaseWithBackend(purchase);
              
              // Finalizar transação
              await RNIap.finishTransaction({ purchase, isConsumable: false });
              
              setState(prev => ({ ...prev, purchasing: false, error: null }));
              console.log('✅ Purchase completed and verified');
            } catch (error) {
              console.error('❌ Error verifying purchase:', error);
              setState(prev => ({ 
                ...prev, 
                purchasing: false, 
                error: 'Erro ao verificar compra. Tente novamente.' 
              }));
            }
          }
        });

        // Listener para erros de compra
        purchaseErrorSubscription = RNIap.purchaseErrorListener((error: any) => {
          console.error('❌ Purchase error:', error);
          setState(prev => ({ 
            ...prev, 
            purchasing: false, 
            error: error.message || 'Erro ao processar pagamento' 
          }));
        });

      } catch (error) {
        console.error('❌ Error initializing IAP:', error);
        setState(prev => ({ ...prev, loading: false, error: 'Erro ao inicializar pagamentos' }));
      }
    };

    initIAP();

    // Cleanup
    return () => {
      if (purchaseUpdateSubscription) {
        purchaseUpdateSubscription.remove();
      }
      if (purchaseErrorSubscription) {
        purchaseErrorSubscription.remove();
      }
      
      // Import dinâmico para cleanup
      import('react-native-iap').then(RNIap => {
        RNIap.endConnection();
      }).catch(() => {});
    };
  }, []);

  const loadSubscriptions = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const RNIap = await import('react-native-iap');
      const subs = await RNIap.getSubscriptions({ skus: SUBSCRIPTION_SKUS });
      console.log('📋 Subscriptions loaded:', subs);
      setState(prev => ({ ...prev, subscriptions: subs, loading: false }));
    } catch (error) {
      console.error('❌ Error loading subscriptions:', error);
      setState(prev => ({ ...prev, loading: false, error: 'Erro ao carregar planos' }));
    }
  };

  const purchaseSubscription = async (sku: string) => {
    try {
      setState(prev => ({ ...prev, purchasing: true, error: null }));
      console.log('🛒 Requesting subscription:', sku);
      
      const RNIap = await import('react-native-iap');
      await RNIap.requestSubscription({ sku });
      
      // O listener purchaseUpdatedListener irá processar o resultado
    } catch (error: any) {
      console.error('❌ Error purchasing subscription:', error);
      setState(prev => ({ 
        ...prev, 
        purchasing: false, 
        error: error.message || 'Erro ao iniciar compra' 
      }));
    }
  };

  const verifyPurchaseWithBackend = async (purchase: Purchase) => {
    const token = await import('@react-native-async-storage/async-storage').then(
      mod => mod.default.getItem('auth_token')
    );
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/verify-purchase`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platform: Platform.OS,
        productId: purchase.productId,
        transactionReceipt: purchase.transactionReceipt,
        purchaseToken: purchase.purchaseToken,
        transactionId: purchase.transactionId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao verificar compra');
    }

    return await response.json();
  };

  return {
    ...state,
    purchaseSubscription,
    refreshSubscriptions: loadSubscriptions,
  };
};
