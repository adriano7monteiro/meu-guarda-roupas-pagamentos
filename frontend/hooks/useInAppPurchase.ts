import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as InAppPurchases from 'expo-in-app-purchases';
import { BACKEND_URL } from '../config/api';

// IDs dos produtos no Google Play Console
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
    let purchaseListener: any;

    const initIAP = async () => {
      try {
        console.log('🔄 Conectando ao IAP...');
        
        await InAppPurchases.connectAsync();
        console.log('✅ IAP conectado');
        
        await loadSubscriptions();

        purchaseListener = InAppPurchases.setPurchaseListener(async ({ responseCode, results, errorCode }) => {
          if (responseCode === InAppPurchases.IAPResponseCode.OK) {
            for (const purchase of results || []) {
              try {
                await verifyPurchaseWithBackend(purchase);
                await InAppPurchases.finishTransactionAsync(purchase, true);
                setState(prev => ({ ...prev, purchasing: false, error: null }));
              } catch (error) {
                console.error('❌ Erro ao verificar compra:', error);
                setState(prev => ({ 
                  ...prev, 
                  purchasing: false, 
                  error: 'Erro ao verificar compra.' 
                }));
              }
            }
          } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
            setState(prev => ({ ...prev, purchasing: false }));
          } else {
            setState(prev => ({ 
              ...prev, 
              purchasing: false, 
              error: `Erro na compra: ${errorCode}` 
            }));
          }
        });

      } catch (error: any) {
        console.error('❌ Erro ao inicializar IAP:', error);
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: `Erro ao inicializar pagamentos: ${error?.message || error}` 
        }));
      }
    };

    initIAP();

    return () => {
      if (purchaseListener) {
        purchaseListener.remove();
      }
      InAppPurchases.disconnectAsync().catch(() => {});
    };
  }, []);

  const loadSubscriptions = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const { responseCode, results } = await InAppPurchases.getProductsAsync(SUBSCRIPTION_SKUS);
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        setState(prev => ({ ...prev, subscriptions: results || [], loading: false }));
      } else {
        throw new Error(`Erro ao carregar produtos. Response code: ${responseCode}`);
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar assinaturas:', error);
      setState(prev => ({ ...prev, loading: false, error: `Erro ao carregar planos: ${error?.message || error}` }));
    }
  };

  const purchaseSubscription = async (sku: string) => {
    try {
      setState(prev => ({ ...prev, purchasing: true, error: null }));
      await InAppPurchases.purchaseItemAsync(sku);
    } catch (error: any) {
      console.error('❌ Erro ao iniciar compra:', error);
      setState(prev => ({ 
        ...prev, 
        purchasing: false, 
        error: error?.message || 'Erro ao iniciar compra' 
      }));
    }
  };

  const verifyPurchaseWithBackend = async (purchase: any) => {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    const token = await AsyncStorage.default.getItem('auth_token');
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    const response = await fetch(`${BACKEND_URL}/api/verify-purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        platform: Platform.OS,
        productId: purchase.productId,
        transactionReceipt: purchase.transactionReceipt,
        purchaseToken: purchase.purchaseToken,
        orderId: purchase.orderId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erro ao verificar compra no servidor');
    }

    return await response.json();
  };

  return {
    ...state,
    purchaseSubscription,
  };
};
