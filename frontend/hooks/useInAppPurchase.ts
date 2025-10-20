import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { BACKEND_URL } from '../config/api';
import * as RNIap from 'react-native-iap';

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
    // 🔥 REMOVENDO TODAS AS VERIFICAÇÕES - SEMPRE TENTAR INICIALIZAR IAP
    // Se falhar, veremos o erro real da biblioteca
    
    console.log('🔍 Informações do dispositivo:', {
      platform: Platform.OS,
      isDevice: Constants.isDevice,
      appOwnership: Constants.appOwnership,
      executionEnvironment: Constants.executionEnvironment,
      expoConfig_extra: Constants.expoConfig?.extra,
    });
    
    console.log('✅ Inicializando IAP SEM verificações - vamos ver o erro real se houver');

    let purchaseUpdateSubscription: any;
    let purchaseErrorSubscription: any;

    const initIAP = async () => {
      try {
        console.log('🔄 Iniciando IAP...');
        console.log('📦 RNIap disponível:', typeof RNIap);
        console.log('📦 Métodos:', Object.keys(RNIap).slice(0, 20));
        
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
            error: `Erro na compra: ${error.message}` 
          }));
        });

      } catch (error: any) {
        console.error('❌ Error initializing IAP:', error);
        console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
        console.error('Stack:', error?.stack);
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: `Erro ao inicializar pagamentos: ${error?.message || error}` 
        }));
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
      
      RNIap.endConnection().catch(() => {});
    };
  }, []);

  const loadSubscriptions = async () => {
    try {
      console.log('📋 Carregando assinaturas... SKUs:', SUBSCRIPTION_SKUS);
      setState(prev => ({ ...prev, loading: true }));
      
      // DEBUG COMPLETO
      console.log('🔍 RNIap é:', RNIap);
      console.log('🔍 Tipo de RNIap:', typeof RNIap);
      console.log('🔍 Keys de RNIap:', Object.keys(RNIap));
      console.log('🔍 getSubscriptions existe?', 'getSubscriptions' in RNIap);
      console.log('🔍 Tipo de getSubscriptions:', typeof RNIap.getSubscriptions);
      
      // Listar TODOS os métodos disponíveis
      const methods = Object.keys(RNIap).filter(key => typeof (RNIap as any)[key] === 'function');
      console.log('🔍 TODOS os métodos disponíveis:', methods);
      
      // Tentar chamar
      if (typeof RNIap.getSubscriptions !== 'function') {
        throw new Error(`getSubscriptions não é uma função. Tipo: ${typeof RNIap.getSubscriptions}. Métodos disponíveis: ${methods.join(', ')}`);
      }
      
      const subs = await RNIap.getSubscriptions(SUBSCRIPTION_SKUS);
      
      console.log('✅ Subscriptions loaded:', subs?.length || 0, 'produtos');
      console.log('Detalhes:', JSON.stringify(subs, null, 2));
      setState(prev => ({ ...prev, subscriptions: subs || [], loading: false }));
    } catch (error: any) {
      console.error('❌ Error loading subscriptions:', error);
      console.error('Detalhes do erro:', error?.message || error);
      console.error('Stack:', error?.stack);
      setState(prev => ({ ...prev, loading: false, error: `Erro ao carregar planos: ${error?.message || error}` }));
    }
  };

  const purchaseSubscription = async (sku: string) => {
    try {
      setState(prev => ({ ...prev, purchasing: true, error: null }));
      console.log('🛒 Requesting subscription:', sku);
      console.log('🔍 Tipo de requestSubscription:', typeof RNIap.requestSubscription);
      
      // API correta para v14.x: requestSubscription com string direto
      await RNIap.requestSubscription(sku);
      
      console.log('✅ Subscription request sent, aguardando confirmação...');
      
      // O listener purchaseUpdatedListener irá processar o resultado
    } catch (error: any) {
      console.error('❌ Error purchasing subscription:', error);
      console.error('Detalhes:', error?.message || error);
      setState(prev => ({ 
        ...prev, 
        purchasing: false, 
        error: error?.message || 'Erro ao iniciar compra' 
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

    const response = await fetch(`${BACKEND_URL}/api/verify-purchase`, {
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
