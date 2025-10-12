import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useModal } from '../hooks/useModal';
import CustomModal from '../components/CustomModal';
import { StripeProvider, useStripe, CardField } from '@stripe/stripe-react-native';

const PLANS = [
  {
    id: 'mensal',
    name: 'Mensal',
    price: 'R$ 19,90',
    priceValue: 19.90,
    interval: '/mês',
    features: ['Looks ilimitados', 'Todas as funcionalidades', 'Suporte prioritário'],
    badge: null,
    color: '#6c5ce7',
  },
  {
    id: 'semestral',
    name: 'Semestral',
    price: 'R$ 99,00',
    priceValue: 99.00,
    interval: '/6 meses',
    features: ['Looks ilimitados', 'Todas as funcionalidades', 'Suporte prioritário', 'Economize 17%'],
    badge: 'POPULAR',
    color: '#00b894',
  },
  {
    id: 'anual',
    name: 'Anual',
    price: 'R$ 179,90',
    priceValue: 179.90,
    interval: '/ano',
    features: ['Looks ilimitados', 'Todas as funcionalidades', 'Suporte prioritário', 'Economize 25%'],
    badge: 'MELHOR VALOR',
    color: '#e17055',
  },
];

function SubscriptionContent() {
  const [selectedPlan, setSelectedPlan] = useState('semestral');
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [publishableKey, setPublishableKey] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const modal = useModal();
  const { confirmPayment } = useStripe();

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/status-assinatura`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        modal.showError('Erro', 'Token de autenticação não encontrado.');
        return;
      }

      // Call backend to create subscription and get client_secret
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/criar-assinatura`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plano: selectedPlan,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPublishableKey(data.publishable_key);
        setPaymentIntentId(data.client_secret.split('_secret_')[0]);
        
        // Initialize and present payment sheet
        const { error: paymentError } = await confirmPayment(data.client_secret, {
          paymentMethodType: 'Card',
        });

        if (paymentError) {
          modal.showError('Erro no Pagamento', paymentError.message || 'Erro ao processar pagamento.');
        } else {
          // Payment successful, confirm on backend
          await confirmSubscriptionPayment(paymentIntentId);
        }
      } else {
        modal.showError('Erro', data.detail || 'Erro ao criar assinatura.');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      modal.showError('Erro', 'Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const confirmSubscriptionPayment = async (paymentId: string) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      const formData = new FormData();
      formData.append('payment_intent_id', paymentId);

      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/confirmar-pagamento`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        modal.showSuccess(
          '🎉 Pagamento Confirmado!',
          `Seu plano ${selectedPlan} está ativo! Aproveite looks ilimitados!`,
          [
            {
              text: 'Começar a Usar',
              onPress: () => {
                modal.hideModal();
                fetchSubscriptionStatus();
                router.push('/generate-look' as any);
              },
              style: 'primary',
            },
          ]
        );
      } else {
        modal.showError('Erro', 'Erro ao confirmar pagamento.');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      modal.showError('Erro', 'Erro de conexão. Tente novamente.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Planos Premium</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Current Status */}
        {subscriptionStatus && (
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Ionicons name="information-circle" size={24} color="#6c5ce7" />
              <Text style={styles.statusTitle}>Status Atual</Text>
            </View>
            
            <View style={styles.statusContent}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Plano:</Text>
                <Text style={styles.statusValue}>
                  {subscriptionStatus.plano_ativo === 'free' ? 'Gratuito' : subscriptionStatus.plano_ativo.charAt(0).toUpperCase() + subscriptionStatus.plano_ativo.slice(1)}
                </Text>
              </View>
              
              {subscriptionStatus.plano_ativo === 'free' && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Looks restantes:</Text>
                  <Text style={[styles.statusValue, { color: '#e17055' }]}>
                    {subscriptionStatus.looks_restantes} de 5
                  </Text>
                </View>
              )}
              
              {subscriptionStatus.plano_ativo !== 'free' && subscriptionStatus.data_expiracao && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Expira em:</Text>
                  <Text style={styles.statusValue}>
                    {new Date(subscriptionStatus.data_expiracao).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Free Plan Info Table */}
            {subscriptionStatus.plano_ativo === 'free' && (
              <View style={styles.limitInfoTable}>
                <Text style={styles.limitInfoTitle}>ℹ️ Limite do Plano Gratuito</Text>
                <View style={styles.limitInfoRow}>
                  <Text style={styles.limitInfoLabel}>Looks "Ver em Mim":</Text>
                  <Text style={styles.limitInfoValue}>5 total (nunca reseta)</Text>
                </View>
                <View style={styles.limitInfoRow}>
                  <Text style={styles.limitInfoLabel}>Sugestões de texto:</Text>
                  <Text style={styles.limitInfoValue}>Ilimitado</Text>
                </View>
                <View style={styles.limitInfoRow}>
                  <Text style={styles.limitInfoLabel}>Upload de roupas:</Text>
                  <Text style={styles.limitInfoValue}>Ilimitado</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Plans */}
        <View style={styles.plansSection}>
          <Text style={styles.sectionTitle}>Escolha seu plano</Text>
          <Text style={styles.sectionSubtitle}>Desbloqueie looks ilimitados com IA!</Text>
          
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.selectedPlanCard,
                { borderColor: plan.color },
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              {plan.badge && (
                <View style={[styles.badge, { backgroundColor: plan.color }]}>
                  <Text style={styles.badgeText}>{plan.badge}</Text>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <View style={styles.planTitleContainer}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.planPrice}>{plan.price}</Text>
                    <Text style={styles.planInterval}>{plan.interval}</Text>
                  </View>
                </View>
                
                <View style={[
                  styles.radioButton,
                  selectedPlan === plan.id && styles.radioButtonSelected,
                  { borderColor: plan.color },
                ]}>
                  {selectedPlan === plan.id && (
                    <View style={[styles.radioButtonInner, { backgroundColor: plan.color }]} />
                  )}
                </View>
              </View>
              
              <View style={styles.featuresContainer}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={20} color={plan.color} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Card Input */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>💳 Informações de Pagamento</Text>
          <CardField
            postalCodeEnabled={false}
            placeholders={{
              number: '4242 4242 4242 4242',
            }}
            cardStyle={{
              backgroundColor: '#2d3436',
              textColor: '#FFFFFF',
              borderRadius: 12,
            }}
            style={{
              width: '100%',
              height: 50,
              marginVertical: 12,
            }}
            onCardChange={(cardDetails) => {
              console.log('Card details:', cardDetails);
            }}
          />
          <Text style={styles.testCardHint}>
            💡 Cartão de teste: 4242 4242 4242 4242, qualquer CVV e data futura
          </Text>
        </View>

        {/* Subscribe Button */}
        <TouchableOpacity 
          style={[
            styles.subscribeButton,
            loading && styles.disabledButton,
            { backgroundColor: PLANS.find(p => p.id === selectedPlan)?.color },
          ]}
          onPress={handleSubscribe}
          disabled={loading}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.subscribeButtonText}>Processando...</Text>
            </>
          ) : (
            <>
              <Ionicons name="card" size={24} color="#fff" />
              <Text style={styles.subscribeButtonText}>Assinar e Pagar Agora</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          🔒 Pagamento seguro processado pelo Stripe
        </Text>
        <Text style={styles.disclaimer}>
          * Cobrança recorrente. Cancele quando quiser. Acesso continua até o fim do período pago.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Custom Modal */}
      <CustomModal
        visible={modal.isVisible}
        type={modal.config.type}
        title={modal.config.title}
        message={modal.config.message}
        buttons={modal.config.buttons}
        onClose={modal.hideModal}
      />
    </SafeAreaView>
  );
}

export default function Subscription() {
  const [publishableKey, setPublishableKey] = useState('pk_live_51SHSpFDGCWpP7oWO6LM77jTz9HYKiqqJsIgfyhMyhBrpIobpXW84HqfdI4d8PqsCDgZX572D4J7zHuMel2MxiRCI00ORm43AvR');

  return (
    <StripeProvider publishableKey={publishableKey}>
      <SubscriptionContent />
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: '#2d3436',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#6c5ce7',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  statusTitle: {
    color: '#6c5ce7',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusContent: {
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    color: '#999',
    fontSize: 16,
  },
  statusValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  limitInfoTable: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#636e72',
  },
  limitInfoTitle: {
    color: '#fdcb6e',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  limitInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  limitInfoLabel: {
    color: '#999',
    fontSize: 14,
  },
  limitInfoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  plansSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: '#999',
    fontSize: 16,
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: '#2d3436',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    position: 'relative',
  },
  selectedPlanCard: {
    borderWidth: 3,
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planTitleContainer: {
    flex: 1,
  },
  planName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  planInterval: {
    color: '#999',
    fontSize: 16,
    marginLeft: 4,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderWidth: 3,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  featuresContainer: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    color: '#fff',
    fontSize: 15,
  },
  paymentSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  paymentTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  testCardHint: {
    color: '#fdcb6e',
    fontSize: 13,
    fontStyle: 'italic',
  },
  subscribeButton: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  disabledButton: {
    backgroundColor: '#636e72',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  disclaimer: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    marginHorizontal: 20,
    fontStyle: 'italic',
  },
});
