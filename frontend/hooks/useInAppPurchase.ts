import { useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
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

/**
 * Hook simplificado para IAP
 * 
 * IMPORTANTE: Este hook usa uma abordagem simplificada que funciona em qualquer ambiente.
 * 
 * Para produção, os produtos devem estar configurados no Google Play Console.
 * O backend fará a validação real dos recibos de compra.
 */
export const useInAppPurchase = () => {
  const [state, setState] = useState<PurchaseState>({
    subscriptions: [],
    loading: true,
    purchasing: false,
    error: null,
  });

  useEffect(() => {
    console.log('✅ Inicializando sistema de assinaturas simplificado');
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      console.log('📋 Carregando planos do backend...');
      setState(prev => ({ ...prev, loading: true }));
      
      // Buscar planos do backend
      const response = await fetch(`${BACKEND_URL}/api/planos`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Planos carregados:', data.length);
        
        // Converter formato do backend para formato esperado
        const subscriptions = data.map((plan: any) => ({
          productId: plan.id,
          title: plan.nome,
          description: plan.descricao,
          price: plan.preco_formatado || `R$ ${plan.preco.toFixed(2)}`,
          priceAmountMicros: plan.preco * 1000000,
          currency: 'BRL',
        }));
        
        setState(prev => ({ ...prev, subscriptions, loading: false }));
      } else {
        throw new Error('Erro ao carregar planos do backend');
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar planos:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: `Erro ao carregar planos: ${error?.message || error}` 
      }));
    }
  };

  const purchaseSubscription = async (sku: string) => {
    try {
      setState(prev => ({ ...prev, purchasing: true, error: null }));
      console.log('🛒 Iniciando fluxo de compra:', sku);
      
      // Mostrar informação ao usuário
      Alert.alert(
        '🚧 Funcionalidade em Desenvolvimento',
        'A integração com Google Play Billing requer:\n\n' +
        '1. App publicado no Google Play Console\n' +
        '2. Produtos configurados no Google Play\n' +
        '3. Conta de testador configurada\n\n' +
        'Para completar a implementação, é necessário:\n' +
        '- Configurar produtos no Google Play Console\n' +
        '- Adicionar biblioteca nativa de billing\n' +
        '- Testar em dispositivo real via Google Play\n\n' +
        'Por enquanto, você pode testar o backend diretamente.',
        [
          {
            text: 'Entendi',
            onPress: () => {
              setState(prev => ({ ...prev, purchasing: false }));
            }
          }
        ]
      );
      
    } catch (error: any) {
      console.error('❌ Erro ao iniciar compra:', error);
      setState(prev => ({ 
        ...prev, 
        purchasing: false, 
        error: error?.message || 'Erro ao iniciar compra' 
      }));
    }
  };

  return {
    ...state,
    purchaseSubscription,
  };
};
