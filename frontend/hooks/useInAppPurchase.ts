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
    console.log('🔍 Informações do dispositivo:', {
      platform: Platform.OS,
    });
    
    console.log('✅ Inicializando IAP com expo-in-app-purchases');

    let purchaseListener: any;

    const initIAP = async () => {
      try {
        console.log('🔄 Conectando ao IAP...');
        
        // Verificar se o módulo nativo está disponível
        if (!InAppPurchases.connectAsync) {
          throw new Error('Módulo nativo expo-in-app-purchases não está disponível. Você precisa fazer um build EAS para testar IAP.');
        }
        
        // Conectar ao serviço de IAP
        await InAppPurchases.connectAsync();
        console.log('✅ IAP conectado com sucesso');
        
        // Carregar produtos
        await loadSubscriptions();

        // Listener para compras
        purchaseListener = InAppPurchases.setPurchaseListener(async ({ responseCode, results, errorCode }) => {
          console.log('📦 Purchase update:', { responseCode, errorCode, results });
          
          if (responseCode === InAppPurchases.IAPResponseCode.OK) {
            for (const purchase of results || []) {
              console.log('✅ Compra recebida:', purchase);
              
              try {
                // Verificar compra no backend
                await verifyPurchaseWithBackend(purchase);
                
                // Finalizar compra
                await InAppPurchases.finishTransactionAsync(purchase, true);
                
                setState(prev => ({ ...prev, purchasing: false, error: null }));
                console.log('✅ Compra finalizada e verificada');
              } catch (error) {
                console.error('❌ Erro ao verificar compra:', error);
                setState(prev => ({ 
                  ...prev, 
                  purchasing: false, 
                  error: 'Erro ao verificar compra. Tente novamente.' 
                }));
              }
            }
          } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
            console.log('⚠️ Usuário cancelou a compra');
            setState(prev => ({ ...prev, purchasing: false }));
          } else {
            console.error('❌ Erro na compra:', errorCode);
            setState(prev => ({ 
              ...prev, 
              purchasing: false, 
              error: `Erro na compra: ${errorCode}` 
            }));
          }
        });

      } catch (error: any) {
        console.error('❌ Erro ao inicializar IAP:', error);
        console.error('Stack:', error?.stack);
        
        // Se o erro for de módulo nativo não encontrado
        if (error?.message?.includes('native module') || error?.message?.includes('ExpoInAppPurchases')) {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: '⚠️ IAP só funciona em build nativo (AAB/IPA). Use: eas build --platform android --profile production' 
          }));
        } else {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: `Erro ao inicializar pagamentos: ${error?.message || error}` 
          }));
        }
      }
    };

    initIAP();

    // Cleanup
    return () => {
      if (purchaseListener) {
        purchaseListener.remove();
      }
      InAppPurchases.disconnectAsync().catch(() => {});
    };
  }, []);

  const loadSubscriptions = async () => {
    try {
      console.log('📋 Carregando assinaturas... SKUs:', SUBSCRIPTION_SKUS);
      setState(prev => ({ ...prev, loading: true }));
      
      // Buscar produtos
      const { responseCode, results } = await InAppPurchases.getProductsAsync(SUBSCRIPTION_SKUS);
      
      console.log('📦 Response code:', responseCode);
      console.log('📦 Produtos retornados:', results);
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        console.log('✅ Assinaturas carregadas:', results?.length || 0, 'produtos');
        setState(prev => ({ ...prev, subscriptions: results || [], loading: false }));
      } else {
        throw new Error(`Erro ao carregar produtos. Response code: ${responseCode}`);
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar assinaturas:', error);
      console.error('Stack:', error?.stack);
      setState(prev => ({ ...prev, loading: false, error: `Erro ao carregar planos: ${error?.message || error}` }));
    }
  };

  const purchaseSubscription = async (sku: string) => {
    try {
      setState(prev => ({ ...prev, purchasing: true, error: null }));
      console.log('🛒 Iniciando compra:', sku);
      
      // Iniciar compra
      await InAppPurchases.purchaseItemAsync(sku);
      
      console.log('✅ Compra iniciada, aguardando confirmação...');
      
      // O listener setPurchaseListener irá processar o resultado
    } catch (error: any) {
      console.error('❌ Erro ao iniciar compra:', error);
      console.error('Stack:', error?.stack);
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
