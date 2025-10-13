import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useModal } from '../hooks/useModal';
import CustomModal from '../components/CustomModal';

export default function ForgotPassword() {
  const router = useRouter();
  const modal = useModal();
  
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) {
      modal.showError('Erro', 'Por favor, digite seu email');
      return;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      modal.showError('Erro', 'Email inválido');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/auth/forgot-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Se tiver código de desenvolvimento (quando email falhar)
        if (data.dev_code) {
          modal.showSuccess(
            '⚠️ Modo Desenvolvimento',
            `Código de recuperação: ${data.dev_code}\n\n${data.note || 'Configure o SendGrid antes de produção'}`,
            [
              {
                text: 'OK',
                onPress: () => {
                  modal.hideModal();
                  setStep('code');
                },
                style: 'primary',
              },
            ]
          );
        } else {
          // Fluxo normal com email enviado
          modal.showSuccess(
            '✅ Código Enviado!',
            'Verifique seu email e digite o código de 6 dígitos',
            [
              {
                text: 'OK',
                onPress: () => {
                  modal.hideModal();
                  setStep('code');
                },
                style: 'primary',
              },
            ]
          );
        }
      } else {
        modal.showError('Erro', data.detail || 'Erro ao enviar código');
      }
    } catch (error) {
      console.error('Error sending code:', error);
      modal.showError('Erro', 'Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code.trim() || code.length !== 6) {
      modal.showError('Erro', 'Digite o código de 6 dígitos');
      return;
    }

    if (!newPassword.trim() || newPassword.length < 6) {
      modal.showError('Erro', 'A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      modal.showError('Erro', 'As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/auth/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            code,
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        modal.showSuccess(
          '✅ Senha Redefinida!',
          'Sua senha foi alterada com sucesso. Faça login com a nova senha.',
          [
            {
              text: 'Fazer Login',
              onPress: () => {
                modal.hideModal();
                router.push('/' as any);
              },
              style: 'primary',
            },
          ]
        );
      } else {
        modal.showError('Erro', data.detail || 'Erro ao redefinir senha');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      modal.showError('Erro', 'Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Recuperar Senha</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {step === 'email' ? (
              // Step 1: Enter Email
              <View>
                <View style={styles.iconContainer}>
                  <Ionicons name="mail" size={60} color="#6c5ce7" />
                </View>

                <Text style={styles.subtitle}>
                  Digite seu email para receber o código de recuperação
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSendCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="send" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Enviar Código</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              // Step 2: Enter Code and New Password
              <View>
                <View style={styles.iconContainer}>
                  <Ionicons name="lock-closed" size={60} color="#6c5ce7" />
                </View>

                <Text style={styles.subtitle}>
                  Digite o código enviado para {email}
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Código de 6 dígitos"
                  placeholderTextColor="#999"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading}
                />

                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Nova Senha"
                    placeholderTextColor="#999"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={24}
                      color="#999"
                    />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Confirmar Nova Senha"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Redefinir Senha</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={() => setStep('email')}
                  disabled={loading}
                >
                  <Text style={styles.resendText}>Não recebeu o código?</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
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
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  input: {
    backgroundColor: '#2d3436',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  passwordInput: {
    backgroundColor: '#2d3436',
    borderRadius: 12,
    padding: 16,
    paddingRight: 50,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#444',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  button: {
    backgroundColor: '#6c5ce7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  resendText: {
    color: '#6c5ce7',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
