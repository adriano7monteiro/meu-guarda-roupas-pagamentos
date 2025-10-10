import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

interface User {
  email: string;
  nome: string;
  foto_corpo: string | null;
  ocasiao_preferida: string;
}

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        await fetchUserProfile(token);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token inválido, limpar storage
        await AsyncStorage.removeItem('auth_token');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      setUser(null);
      Alert.alert('Sucesso', 'Logout realizado com sucesso!');
    } catch (error) {
      console.error('Error during logout:', error);
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
              <Text style={styles.mainActionTitle}>Gerar Meu Look do Dia</Text>
              <Text style={styles.mainActionSubtitle}>
                Deixe a IA criar o look perfeito para você
              </Text>
            </View>
          </TouchableOpacity>

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

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Suas estatísticas</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Roupas</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Looks Criados</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Favoritos</Text>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Auth Screen Component
function AuthScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !nome)) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email, password }
        : { email, password, nome, ocasiao_preferida: 'casual' };

      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('auth_token', data.token);
        onLogin(data.user);
        Alert.alert('Sucesso', isLogin ? 'Login realizado com sucesso!' : 'Conta criada com sucesso!');
      } else {
        Alert.alert('Erro', data.detail || 'Erro durante autenticação');
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Erro', 'Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.authContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <View style={styles.authContent}>
        <Text style={styles.authTitle}>Meu Look IA</Text>
        <Text style={styles.authSubtitle}>
          {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
        </Text>

        <View style={styles.authForm}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>E-mail</Text>
            <Text style={styles.inputText}>
              {email || 'Digite seu e-mail'}
            </Text>
          </View>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nome</Text>
              <Text style={styles.inputText}>
                {nome || 'Digite seu nome'}
              </Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Senha</Text>
            <Text style={styles.inputText}>
              {password ? '••••••••' : 'Digite sua senha'}
            </Text>
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
        </View>

        {/* Demo inputs - Remove in production */}
        <View style={styles.demoInputs}>
          <Text style={styles.demoTitle}>Demo - Inputs reais (temporário):</Text>
          <Text style={styles.demoInput} onChangeText={setEmail} placeholder="E-mail">
            {email}
          </Text>
          {!isLogin && (
            <Text style={styles.demoInput} onChangeText={setNome} placeholder="Nome">
              {nome}
            </Text>
          )}
          <Text style={styles.demoInput} onChangeText={setPassword} placeholder="Senha" secureTextEntry>
            {password}
          </Text>
        </View>
      </View>
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
    paddingBottom: 20,
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
  inputText: {
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
  
  // Demo inputs (temporary)
  demoInputs: {
    marginTop: 40,
    padding: 16,
    backgroundColor: '#2d3436',
    borderRadius: 12,
  },
  demoTitle: {
    color: '#fdcb6e',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  demoInput: {
    backgroundColor: '#636e72',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    fontSize: 16,
  },
});