import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  ActivityIndicator,
} from 'react-native';
import CustomModal from '../components/CustomModal';
import { useModal } from '../hooks/useModal';
import { BACKEND_URL } from '../config/api';

interface User {
  email: string;
  nome: string;
  foto_corpo: string | null;
  ocasiao_preferida: string;
}

interface SubscriptionStatus {
  plano_ativo: string;
  plan_details: {
    name: string;
    badge?: string;
    color: string;
  } | null;
  is_premium: boolean;
  looks_usados: number;
  looks_restantes: number | string;
  data_expiracao: string | null;
  plan_expired: boolean;
}

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  // REMOVIDO: stats state - não é mais necessário
  const [suggestionText, setSuggestionText] = useState('');
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [sendingSuggestion, setSendingSuggestion] = useState(false);
  const modal = useModal();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    // Fetch subscription status when user becomes available
    const fetchStatus = async () => {
      const token = await AsyncStorage.getItem('auth_token');
      if (token && user) {
        await fetchSubscriptionStatus(token);
      }
    };
    
    fetchStatus();
  }, [user]);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        await fetchUserProfile(token);
        await fetchSubscriptionStatus(token);
        // REMOVIDO: fetchStats(token) - não é mais necessário
      }
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        // Fetch subscription status after getting user
        await fetchSubscriptionStatus(token);
      } else {
        // Token inválido, limpar storage
        await AsyncStorage.removeItem('auth_token');
      }
    } catch (error) {
      
    }
  };

  const fetchSubscriptionStatus = async (token: string) => {
    try {
      
      const response = await fetch(`${BACKEND_URL}/api/status-assinatura`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const statusData = await response.json();
       
        setSubscriptionStatus(statusData);
      } else {
        
      }
    } catch (error) {
      
    }
  };

  // REMOVIDO: fetchStats - não é mais necessário

  const handleSendSuggestion = async () => {
    if (!suggestionText.trim()) {
      modal.showWarning('Atenção', 'Por favor, escreva sua sugestão antes de enviar.');
      return;
    }

    setSendingSuggestion(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${BACKEND_URL}/api/sugestoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          mensagem: suggestionText
        }),
      });

      if (response.ok) {
        setShowSuggestionModal(false);
        setSuggestionText('');
        modal.showSuccess(
          'Obrigado!', 
          'Sua sugestão foi enviada com sucesso. Agradecemos seu feedback!'
        );
      } else {
        modal.showError('Erro', 'Erro ao enviar sugestão. Tente novamente.');
      }
    } catch (error) {
      console.error('Error sending suggestion:', error);
      modal.showError('Erro', 'Erro de conexão. Tente novamente.');
    } finally {
      setSendingSuggestion(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      setUser(null);
      modal.showSuccess('Sucesso', 'Logout realizado com sucesso!');
    } catch (error) {
      
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meu Look IA</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Olá, {user.nome}! 👋</Text>
        <Text style={styles.subtitleText}>
          Pronto para criar looks incríveis hoje?
        </Text>
      </View>

      {/* Main Actions */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.actionsContainer}>
          
          {/* Generate Look Button - Main CTA */}
          <TouchableOpacity 
            style={styles.mainActionButton}
            onPress={() => router.push('/generate-look' as any)}
          >
            <View style={styles.mainActionContent}>
              <Ionicons name="sparkles" size={32} color="#fff" />
              <Text style={styles.mainActionTitle}>Gerar Meu Look</Text>
              <Text style={styles.mainActionSubtitle}>
                Deixe a IA criar o look perfeito para você
              </Text>
            </View>
          </TouchableOpacity>


          {/* Sugerir Peças Button - New Section */}
          <TouchableOpacity 
            style={styles.suggestPiecesButton}
            onPress={() => router.push('/suggest-pieces' as any)}
          >
            <View style={styles.suggestPiecesContent}>
              <Ionicons name="cart-outline" size={28} color="#6c5ce7" />
              <View style={styles.suggestPiecesText}>
                <Text style={styles.suggestPiecesTitle}>Sugerir Peças de Roupa</Text>
                <Text style={styles.suggestPiecesSubtitle}>
                  Descubra o que falta no seu guarda-roupa
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#6c5ce7" />
            </View>
          </TouchableOpacity>


          {/* Premium Banner - COMENTADO TEMPORARIAMENTE */}
          {/* 
          {subscriptionStatus?.is_premium ? (
            // Active Premium Card
            <View style={styles.activePremiumCard}>
              <View style={styles.activePremiumHeader}>
                <View style={styles.activePremiumBadge}>
                  <Ionicons name="diamond" size={20} color="#FFD700" />
                  <Text style={styles.activePremiumBadgeText}>
                    {subscriptionStatus.plan_details?.badge || 'PREMIUM'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/subscription' as any)}>
                  <Ionicons name="settings-outline" size={24} color="#FFD700" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.activePremiumTitle}>
                {subscriptionStatus.plan_details?.name || 'Plano Premium'}
              </Text>
              
              <View style={styles.premiumStatsRow}>
                <View style={styles.premiumStat}>
                  <Ionicons name="infinite" size={24} color="#FFD700" />
                  <Text style={styles.premiumStatLabel}>Looks Ilimitados</Text>
                </View>
                <View style={styles.premiumStatDivider} />
                <View style={styles.premiumStat}>
                  <Ionicons name="calendar-outline" size={24} color="#FFD700" />
                  <Text style={styles.premiumStatLabel}>
                    {subscriptionStatus.data_expiracao 
                      ? `Renova em ${new Date(subscriptionStatus.data_expiracao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
                      : 'Ativo'
                    }
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            // Free User - Upgrade Banner
            <TouchableOpacity 
              style={styles.premiumBanner}
              onPress={() => router.push('/subscription' as any)}
            >
              <View style={styles.premiumContent}>
                <View style={styles.premiumIcon}>
                  <Ionicons name="diamond" size={24} color="#FFD700" />
                </View>
                <View style={styles.premiumText}>
                  <Text style={styles.premiumTitle}>Assine o Premium</Text>
                  <Text style={styles.premiumSubtitle}>
                    {subscriptionStatus 
                      ? `${subscriptionStatus.looks_restantes}/5 looks gratuitos restantes`
                      : 'Looks ilimitados por R$ 19,90/mês'
                    }
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#FFD700" />
              </View>
            </TouchableOpacity>
          )}
          */}


          {/* Secondary Actions Grid */}
          <View style={styles.secondaryGrid}>
            <TouchableOpacity 
              style={styles.gridItem}
              onPress={() => router.push('/upload-clothes' as any)}
            >
              <Ionicons name="camera" size={28} color="#6c5ce7" />
              <Text style={styles.gridItemTitle}>Adicionar</Text>
              <Text style={styles.gridItemSubtitle}>Roupas</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.gridItem}
              onPress={() => router.push('/my-wardrobe' as any)}
            >
              <Ionicons name="shirt" size={28} color="#00b894" />
              <Text style={styles.gridItemTitle}>Meu</Text>
              <Text style={styles.gridItemSubtitle}>Guarda-roupa</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.gridItem}
              onPress={() => router.push('/saved-looks' as any)}
            >
              <Ionicons name="heart" size={28} color="#e17055" />
              <Text style={styles.gridItemTitle}>Looks</Text>
              <Text style={styles.gridItemSubtitle}>Salvos</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.gridItem}
              onPress={() => router.push('/profile' as any)}
            >
              <Ionicons name="person" size={28} color="#fdcb6e" />
              <Text style={styles.gridItemTitle}>Meu</Text>
              <Text style={styles.gridItemSubtitle}>Perfil</Text>
            </TouchableOpacity>
          </View>

          {/* Courses Section - New */}
          <TouchableOpacity 
            style={styles.coursesSection}
            onPress={() => router.push('/courses' as any)}
          >
            <View style={styles.coursesSectionContent}>
              <View style={styles.coursesSectionIcon}>
                <Ionicons name="school-outline" size={32} color="#6c5ce7" />
              </View>
              <View style={styles.coursesSectionText}>
                <Text style={styles.coursesSectionTitle}>Aprenda se Vestir com Nossos Cursos</Text>
                <Text style={styles.coursesSectionSubtitle}>
                  Descubra dicas profissionais de estilo e moda
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#6c5ce7" />
            </View>
          </TouchableOpacity>

          {/* Suggestion Card */}
          <TouchableOpacity 
            style={styles.suggestionCard}
            onPress={() => setShowSuggestionModal(true)}
          >
            <View style={styles.suggestionIconContainer}>
              <Ionicons name="bulb" size={32} color="#f39c12" />
            </View>
            <View style={styles.suggestionContent}>
              <Text style={styles.suggestionTitle}>💬 Envie sua sugestão</Text>
              <Text style={styles.suggestionText}>
                Ajude-nos a melhorar! Compartilhe suas ideias e sugestões.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#6c5ce7" />
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Suggestion Modal */}
      <Modal
        visible={showSuggestionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSuggestionModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContainer}>
              <View style={styles.suggestionModalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>💡 Sua Sugestão</Text>
                  <TouchableOpacity onPress={() => setShowSuggestionModal(false)}>
                    <Ionicons name="close" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalDescription}>
                  Conte-nos como podemos melhorar o app! Sua opinião é muito importante para nós.
                </Text>

                <TextInput
                  style={styles.suggestionInput}
                  placeholder="Digite sua sugestão aqui..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={6}
                  value={suggestionText}
                  onChangeText={setSuggestionText}
                  textAlignVertical="top"
                />

                <TouchableOpacity 
                  style={[styles.sendButton, sendingSuggestion && styles.sendButtonDisabled]}
                  onPress={handleSendSuggestion}
                  disabled={sendingSuggestion}
                >
                  {sendingSuggestion ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="send" size={20} color="#fff" />
                      <Text style={styles.sendButtonText}>Enviar Sugestão</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Main Dashboard Modal */}
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

// Auth Screen Component
function AuthScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [sexo, setSexo] = useState('masculino');
  const [loading, setLoading] = useState(false);
  const authModal = useModal();

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !nome)) {
      authModal.showError('Campos Obrigatórios', 'Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email, password }
        : { email, password, nome, sexo, ocasiao_preferida: 'casual' };

      

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

     

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
       
        authModal.showError('Erro de Servidor', 'Resposta inválida do servidor. Tente novamente.');
        return;
      }

      const data = await response.json();
     

      if (response.ok) {
        await AsyncStorage.setItem('auth_token', data.token);
        onLogin(data.user);
        authModal.showSuccess('Sucesso', isLogin ? 'Login realizado com sucesso!' : 'Conta criada com sucesso!');
      } else {
        authModal.showError('Erro de Autenticação', data.detail || 'Erro durante autenticação');
      }
    } catch (error) {
    
      if (error instanceof SyntaxError) {
        authModal.showError('Erro de Formato', 'Resposta inválida do servidor (JSON Parse Error)');
      } else {
        authModal.showError('Erro de Conexão', 'Erro de conexão. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.authContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.authContent}>
        <Text style={styles.authTitle}>Meu Look IA</Text>
        <Text style={styles.authSubtitle}>
          {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
        </Text>

        <View style={styles.authForm}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu e-mail"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nome</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite seu nome"
                placeholderTextColor="#999"
                value={nome}
                onChangeText={setNome}
                editable={!loading}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite sua senha"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              editable={!loading}
            />
          </View>

          <TouchableOpacity 
            style={styles.authButton}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.authButtonText}>
              {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchButtonText}>
              {isLogin ? 'Não tem conta? Criar conta' : 'Já tem conta? Entrar'}
            </Text>
          </TouchableOpacity>

          {/* Forgot Password Link - Only show on login */}
          {isLogin && (
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() => router.push('/forgot-password')}
            >
              <Ionicons name="key-outline" size={16} color="#6c5ce7" />
              <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Auth Modal */}
        <CustomModal
          visible={authModal.isVisible}
          type={authModal.config.type}
          title={authModal.config.title}
          message={authModal.config.message}
          buttons={authModal.config.buttons}
          onClose={authModal.hideModal}
        />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
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
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 8,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitleText: {
    color: '#999',
    fontSize: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'android' ? 100 : 20,
  },
  mainActionButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#6c5ce7',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  mainActionContent: {
    alignItems: 'center',
  },
  mainActionTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  mainActionSubtitle: {
    color: '#e0d9ff',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  premiumBanner: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  premiumIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumText: {
    flex: 1,
  },
  premiumTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  premiumSubtitle: {
    color: '#fff',
    fontSize: 14,
    marginTop: 2,
  },
  // Active Premium Card styles
  activePremiumCard: {
    backgroundColor: '#2d3436',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FFD700',
    ...Platform.select({
      ios: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  activePremiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activePremiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  activePremiumBadgeText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  activePremiumTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  premiumStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  premiumStat: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  premiumStatLabel: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
  },
  premiumStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#636e72',
  },
  secondaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  gridItem: {
    backgroundColor: '#2d3436',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  gridItemTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
  gridItemSubtitle: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
  },
  statsContainer: {
    backgroundColor: '#2d3436',
    borderRadius: 16,
    padding: 20,
  },
  statsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#6c5ce7',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
  },
  
  // Auth styles
  authContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  authContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  authTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  authSubtitle: {
    color: '#999',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
  },
  authForm: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2d3436',
    color: '#fff',
    fontSize: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#636e72',
  },
  authButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  switchButtonText: {
    color: '#6c5ce7',
    fontSize: 16,
  },
  forgotPasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  forgotPasswordText: {
    color: '#6c5ce7',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  suggestionCard: {
    backgroundColor: '#2d3436',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#f39c12',
  },
  suggestionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(243, 156, 18, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  suggestionText: {
    color: '#999',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    padding: 20,
  },
  suggestionModalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    borderWidth: 2,
    borderColor: '#6c5ce7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  modalDescription: {
    color: '#999',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  suggestionInput: {
    backgroundColor: '#2d3436',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 15,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#636e72',
    marginBottom: 20,
  },
  sendButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#636e72',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Sugerir Peças Styles
  suggestPiecesButton: {
    backgroundColor: '#2d3436',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#6c5ce7',
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  suggestPiecesContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  suggestPiecesText: {
    flex: 1,
  },
  suggestPiecesTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  suggestPiecesSubtitle: {
    color: '#999',
    fontSize: 13,
  },
  // Courses Section Styles
  coursesSection: {
    backgroundColor: '#2d3436',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#6c5ce7',
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  coursesSectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  coursesSectionIcon: {
    backgroundColor: 'rgba(108, 92, 231, 0.2)',
    borderRadius: 16,
    padding: 16,
  },
  coursesSectionText: {
    flex: 1,
  },
  coursesSectionTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 6,
    lineHeight: 22,
  },
  coursesSectionSubtitle: {
    color: '#b2bec3',
    fontSize: 14,
    lineHeight: 18,
  },
});