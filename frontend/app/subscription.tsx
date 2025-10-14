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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useModal } from '../hooks/useModal';
import CustomModal from '../components/CustomModal';
import { StripeProvider, useStripe } from '../utils/stripeProvider';

function SubscriptionContent() {
  const [selectedPlan, setSelectedPlan] = useState('semestral');
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const modal = useModal();
  
  // Use Stripe hooks only on native platforms
  const stripeHooks = Platform.OS !== 'web' && useStripe ? useStripe() : { initPaymentSheet: null, presentPaymentSheet: null };
  const { initPaymentSheet, presentPaymentSheet } = stripeHooks;

  useEffect(() => {
    fetchSubscriptionStatus();
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/planos`);
      if (response.ok) {
        const data = await response.json();
        // Format plans for display
        const formattedPlans = data.map((plan: any) => ({
          ...plan,
          priceValue: plan.price / 100,
          price: `R$ ${(plan.price / 100).toFixed(2).replace('.', ',')}`,
          interval: plan.interval === 'year' ? '/ano' : plan.interval_count === 6 ? '/6 meses' : '/mês',
        }));
        setPlans(formattedPlans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      modal.showError('Erro', 'Erro ao carregar planos. Tente novamente.');
    } finally {
      setLoadingPlans(false);
    }
  };

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
    // Check if running on web
    if (Platform.OS === 'web') {
      modal.showWarning(
        '📱 Use o App Mobile',
        'O pagamento com Stripe funciona apenas no app mobile (iOS/Android). Abra este app no Expo Go do seu celular para assinar!',
        [
          {
            text: 'Entendi',
            onPress: () => modal.hideModal(),
          },
        ]
      );
      return;
    }

    // Dismiss keyboard before showing payment sheet (workaround for topFocus bug)
    if (Platform.OS !== 'web') {
      const { Keyboard } = require('react-native');
      Keyboard.dismiss();
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setLoading(true);
    
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        modal.showError('Erro', 'Token de autenticação não encontrado.');
        return;
      }

      // Step 1: Create subscription and get payment intent from backend
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

      if (!response.ok) {
        modal.showError('Erro', data.detail || 'Erro ao criar assinatura.');
        return;
      }

      // Step 2: Initialize Payment Sheet with client_secret from backend
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Meu Look IA',
        paymentIntentClientSecret: data.client_secret,
        customerId: data.customer_id,
        defaultBillingDetails: {
          address: {
            country: 'BR',
          },
        },
        returnURL: 'meulookia://stripe-redirect',
        appearance: {
          colors: {
            primary: '#6c5ce7',
          },
        },
      });

      if (initError) {
        modal.showError('Erro', `Erro ao inicializar pagamento: ${initError.message}`);
        return;
      }

      // Step 3: Present the Payment Sheet to user
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        // User cancelled or error occurred
        if (presentError.code === 'Canceled') {
          modal.showWarning('Pagamento Cancelado', 'Você cancelou o pagamento.');
        } else {
          modal.showError('Erro no Pagamento', presentError.message);
        }
        return;
      }

      // Step 4: Payment successful! Confirm on backend
      await confirmPayment(data.payment_intent_id);

    } catch (error) {
      console.error('Error creating subscription:', error);
      modal.showError('Erro', 'Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (paymentIntentId: string) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      const formData = new FormData();
      formData.append('payment_intent_id', paymentIntentId);

      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/confirmar-pagamento`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('Confirm payment response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Payment confirmed successfully:', data);
        
        modal.showSuccess(
          '🎉 Pagamento Confirmado!',
          `Seu plano ${selectedPlan} está ativo! Aproveite looks ilimitados!`,
          [
            {
              text: 'OK',
              onPress: () => {
                modal.hideModal();
                fetchSubscriptionStatus();
                router.push('/' as any);
              },
              style: 'primary',
            },
          ]
        );
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
        console.error('Payment confirmation failed:', response.status, errorData);
        
        modal.showError(
          'Erro ao Confirmar Pagamento', 
          errorData.detail || 'Erro ao confirmar pagamento. Entre em contato com o suporte.'
        );
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
    }
  };

  const confirmSubscription = async (subscriptionId: string) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      const formData = new FormData();
      formData.append('subscription_id', subscriptionId);

      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/confirmar-assinatura`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        modal.showSuccess(
          '🎉 Assinatura Ativada!',
          `Seu plano ${selectedPlan} está ativo! Aproveite looks ilimitados!`,
          [
            {
              text: 'OK',
              onPress: () => {
                modal.hideModal();
                router.push('/' as any);
              },
              style: 'primary',
            },
          ]
        );
        fetchSubscriptionStatus();
      } else {
        modal.showError('Erro', 'Erro ao confirmar assinatura.');
      }
    } catch (error) {
      console.error('Error confirming subscription:', error);
      modal.showError('Erro', 'Erro de conexão. Tente novamente.');
    }
  };

  const handleCancelSubscription = async () => {
    modal.showWarning(
      '⚠️ Cancelar Assinatura',
      'Tem certeza que deseja cancelar? Você continuará com acesso premium até o fim do período pago.',
      [
        {
          text: 'Voltar',
          onPress: () => modal.hideModal(),
          style: 'secondary',
        },
        {
          text: 'Sim, Cancelar',
          onPress: async () => {
            modal.hideModal();
            setLoading(true);
            
            try {
              const token = await AsyncStorage.getItem('auth_token');
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/cancelar-assinatura`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              const data = await response.json();

              if (response.ok) {
                modal.showSuccess(
                  '✅ Assinatura Cancelada',
                  data.details || 'Você continuará com acesso até o fim do período pago.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        modal.hideModal();
                        fetchSubscriptionStatus();
                      },
                      style: 'primary',
                    },
                  ]
                );
              } else {
                modal.showError('Erro', data.detail || 'Erro ao cancelar assinatura.');
              }
            } catch (error) {
              console.error('Error cancelling subscription:', error);
              modal.showError('Erro', 'Erro de conexão. Tente novamente.');
            } finally {
              setLoading(false);
            }
          },
          style: 'danger',
        },
      ]
    );
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

        {/* Manage Subscription - Cancel/Reactivate */}
        {subscriptionStatus && subscriptionStatus.plano_ativo !== 'free' && (
          <View style={styles.manageCard}>
            <View style={styles.manageHeader}>
              <Ionicons name="settings" size={24} color="#ff6348" />
              <Text style={styles.manageTitle}>Gerenciar Assinatura</Text>
            </View>
            
            <Text style={styles.manageDescription}>
              Você pode cancelar sua assinatura a qualquer momento. Continuará com acesso até o fim do período pago.
            </Text>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancelSubscription}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="close-circle" size={20} color="#fff" />
                  <Text style={styles.cancelButtonText}>Cancelar Assinatura</Text>
                </>
              )}
            </TouchableOpacity>
            
            <Text style={styles.manageNote}>
              ℹ️ Após cancelar, você pode reativar antes do fim do período pago
            </Text>
          </View>
        )}

        {/* Plans */}
        <View style={styles.plansSection}>
          <Text style={styles.sectionTitle}>Escolha seu plano</Text>
          <Text style={styles.sectionSubtitle}>Desbloqueie looks ilimitados com IA!</Text>
          
          {loadingPlans ? (
            <ActivityIndicator size="large" color="#6c5ce7" style={{marginTop: 20}} />
          ) : plans.length === 0 ? (
            <Text style={{color: '#999', textAlign: 'center', marginTop: 20}}>
              Nenhum plano disponível no momento.
            </Text>
          ) : null}
          
          {plans.map((plan) => (
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

        {/* Subscribe Button */}
        <TouchableOpacity 
          style={[
            styles.subscribeButton,
            loading && styles.disabledButton,
            { backgroundColor: plans.find(p => p.id === selectedPlan)?.color || '#6c5ce7' },
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
              <Text style={styles.subscribeButtonText}>Assinar Agora</Text>
            </>
          )}
        </TouchableOpacity>

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
  manageCard: {
    backgroundColor: '#2d3436',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#ff6348',
  },
  manageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  manageTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  manageDescription: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  cancelButton: {
    backgroundColor: '#ff6348',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  manageNote: {
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
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

// Wrapper component with Stripe Provider
export default function Subscription() {
  const [publishableKey] = useState('pk_live_51SIEHk6nJMuXEwW5cet6jWTF4rjgd36jZ21ruTDLkOUKQoIetCPooK0p2GzT5pAerUPsUEjjZY8wJp1B8qw8SCDR00hgOhUJgM');
  const [stripeReady, setStripeReady] = useState(false);

  useEffect(() => {
    // Load Stripe only on native platforms after mount
    if (Platform.OS !== 'web' && StripeProvider) {
      setStripeReady(true);
    }
  }, []);

  // Only wrap with StripeProvider on native platforms
  if (Platform.OS === 'web' || !StripeProvider || !stripeReady) {
    return <SubscriptionContent />;
  }

  return (
    <StripeProvider publishableKey={publishableKey}>
      <SubscriptionContent />
    </StripeProvider>
  );
}
