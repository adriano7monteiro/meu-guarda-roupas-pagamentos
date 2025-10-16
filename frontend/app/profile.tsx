import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../config/api';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BACKEND_URL } from '../config/api';
import * as ImagePicker from 'expo-image-picker';
import { BACKEND_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../config/api';
import { router } from 'expo-router';
import { BACKEND_URL } from '../config/api';

interface UserProfile {
  email: string;
  nome: string;
  foto_corpo: string | null;
  ocasiao_preferida: string;
  created_at: string;
}

const OCCASION_OPTIONS = [
  { id: 'casual', label: 'Casual', icon: 'shirt' as const },
  { id: 'trabalho', label: 'Trabalho', icon: 'briefcase' as const },
  { id: 'festa', label: 'Festa', icon: 'wine' as const },
  { id: 'esporte', label: 'Esporte', icon: 'fitness' as const },
];

export default function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        Alert.alert('Erro', 'Token de autenticação não encontrado.');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        Alert.alert('Erro', 'Erro ao carregar perfil.');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Erro', 'Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const selectBodyPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64 = result.assets[0].base64;
        if (base64) {
          await uploadBodyPhoto(`data:image/jpeg;base64,${base64}`);
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Erro', 'Erro ao selecionar imagem. Tente novamente.');
    }
  };

  const takeBodyPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para usar a câmera.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [9, 16],  // Aspecto mais alto para corpo inteiro (quase tela cheia)
        quality: 0.8,
        base64: true,
        exif: false,
        presentationStyle: 'fullScreen',
      });

      if (!result.canceled && result.assets[0]) {
        const base64 = result.assets[0].base64;
        if (base64) {
          await uploadBodyPhoto(`data:image/jpeg;base64,${base64}`);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Erro', 'Erro ao tirar foto. Tente novamente.');
    }
  };

  const uploadBodyPhoto = async (imageBase64: string) => {
    setUploading(true);

    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      const formData = new FormData();
      formData.append('imagem', imageBase64);

      const response = await fetch(`${BACKEND_URL}/api/upload-foto-corpo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        Alert.alert('Sucesso', 'Foto do corpo atualizada com sucesso!');
        await fetchUserProfile(); // Refresh profile
      } else {
        Alert.alert('Erro', 'Erro ao atualizar foto do corpo.');
      }
    } catch (error) {
      console.error('Error uploading body photo:', error);
      Alert.alert('Erro', 'Erro de conexão. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('auth_token');
              // Navigate back to main screen which will show login
              router.replace('/' as any);
            } catch (error) {
              console.error('Error during logout:', error);
            }
          }
        }
      ]
    );
  };

  if (loading || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#e17055" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Profile Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          
          <View style={styles.profileCard}>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user.nome}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userDate}>
                Membro desde {new Date(user.created_at).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          </View>
        </View>

        {/* Body Photo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Foto do Corpo</Text>
          <Text style={styles.sectionSubtitle}>
            Use para o try-on virtual de roupas
          </Text>
          
          <View style={styles.bodyPhotoContainer}>
            {user.foto_corpo ? (
              <View style={styles.bodyPhotoWithImage}>
                <Image 
                  source={{ uri: user.foto_corpo }} 
                  style={styles.bodyPhotoImage}
                  resizeMode="cover"
                />
                <Text style={styles.bodyPhotoText}>Foto cadastrada ✓</Text>
              </View>
            ) : (
              <View style={styles.bodyPhotoPlaceholder}>
                <Ionicons name="person-outline" size={60} color="#636e72" />
                <Text style={styles.noBodyPhotoText}>Nenhuma foto cadastrada</Text>
              </View>
            )}
            
            <View style={styles.photoButtonsContainer}>
              <TouchableOpacity 
                style={styles.photoButton} 
                onPress={takeBodyPhoto}
                disabled={uploading}
              >
                <Ionicons name="camera" size={20} color="#6c5ce7" />
                <Text style={styles.photoButtonText}>
                  {uploading ? 'Enviando...' : 'Tirar Foto'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.photoButton} 
                onPress={selectBodyPhoto}
                disabled={uploading}
              >
                <Ionicons name="images" size={20} color="#00b894" />
                <Text style={styles.photoButtonText}>
                  {uploading ? 'Enviando...' : 'Da Galeria'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferências</Text>
          
          <View style={styles.preferenceCard}>
            <View style={styles.preferenceHeader}>
              <Text style={styles.preferenceLabel}>Ocasião preferida</Text>
              <Text style={styles.preferenceValue}>{user.ocasiao_preferida}</Text>
            </View>
            
            <Text style={styles.preferenceDescription}>
              Esta é sua ocasião padrão para sugestões de looks
            </Text>
          </View>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre o App</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="sparkles" size={20} color="#6c5ce7" />
              <Text style={styles.infoText}>
                Sugestões personalizadas com IA
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="shirt" size={20} color="#00b894" />
              <Text style={styles.infoText}>
                Organize seu guarda-roupa digital
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="heart" size={20} color="#e17055" />
              <Text style={styles.infoText}>
                Salve seus looks favoritos
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="cloud" size={20} color="#74b9ff" />
              <Text style={styles.infoText}>
                Sugestões baseadas no clima
              </Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>Sair da Conta</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: '#999',
    fontSize: 14,
    marginBottom: 20,
  },
  profileCard: {
    backgroundColor: '#2d3436',
    borderRadius: 16,
    padding: 20,
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  userEmail: {
    color: '#6c5ce7',
    fontSize: 16,
    marginBottom: 8,
  },
  userDate: {
    color: '#999',
    fontSize: 14,
  },
  bodyPhotoContainer: {
    alignItems: 'center',
  },
  bodyPhotoPlaceholder: {
    width: 200,
    height: 250,
    backgroundColor: '#2d3436',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#636e72',
    borderStyle: 'dashed',
  },
  bodyPhotoWithImage: {
    width: 200,
    height: 250,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  bodyPhotoImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#2d3436',
  },
  bodyPhotoText: {
    color: '#6c5ce7',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
  noBodyPhotoText: {
    color: '#999',
    fontSize: 16,
    marginTop: 12,
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  photoButton: {
    backgroundColor: '#2d3436',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#636e72',
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  preferenceCard: {
    backgroundColor: '#2d3436',
    borderRadius: 12,
    padding: 16,
  },
  preferenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  preferenceLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  preferenceValue: {
    color: '#6c5ce7',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  preferenceDescription: {
    color: '#999',
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: '#2d3436',
    borderRadius: 12,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 16,
  },
  logoutButton: {
    backgroundColor: '#e17055',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});