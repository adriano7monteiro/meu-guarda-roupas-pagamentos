import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

const CLOTHING_TYPES = [
  { id: 'camiseta', label: 'Camiseta', icon: 'shirt' as const },
  { id: 'calca', label: 'Calça', icon: 'help' as const },
  { id: 'vestido', label: 'Vestido', icon: 'woman' as const },
  { id: 'sapato', label: 'Sapato', icon: 'footsteps' as const },
  { id: 'acessorio', label: 'Acessório', icon: 'watch' as const },
  { id: 'jaqueta', label: 'Jaqueta', icon: 'layers' as const },
];

const CLOTHING_COLORS = [
  'Preto', 'Branco', 'Cinza', 'Azul', 'Vermelho', 'Verde',
  'Amarelo', 'Rosa', 'Roxo', 'Marrom', 'Bege', 'Laranja'
];

const CLOTHING_STYLES = [
  'Casual', 'Formal', 'Esportivo', 'Elegante', 'Vintage', 'Moderno'
];

export default function UploadClothes() {
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [clothingData, setClothingData] = useState({
    nome: '',
    tipo: '',
    cor: '',
    estilo: '',
  });
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'success' as 'success' | 'error',
    title: '',
    message: '',
    buttons: [] as Array<{text: string, onPress: () => void, style?: 'primary' | 'secondary'}>
  });

  const showModal = (
    type: 'success' | 'error',
    title: string,
    message: string,
    buttons: Array<{text: string, onPress: () => void, style?: 'primary' | 'secondary'}>
  ) => {
    setModalConfig({ type, title, message, buttons });
    setModalVisible(true);
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showModal('error', 'Permissão Necessária', 'Precisamos de permissão para acessar suas fotos.', [
        { text: 'OK', onPress: () => setModalVisible(false) }
      ]);
      return false;
    }
    return true;
  };

  const selectImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64 = result.assets[0].base64;
        if (base64) {
          setSelectedImage(`data:image/jpeg;base64,${base64}`);
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      showModal('error', 'Erro', 'Erro ao selecionar imagem. Tente novamente.', [
        { text: 'OK', onPress: () => setModalVisible(false) }
      ]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showModal('error', 'Permissão Necessária', 'Precisamos de permissão para usar a câmera.', [
        { text: 'OK', onPress: () => setModalVisible(false) }
      ]);
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64 = result.assets[0].base64;
        if (base64) {
          setSelectedImage(`data:image/jpeg;base64,${base64}`);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showModal('error', 'Erro', 'Erro ao tirar foto. Tente novamente.', [
        { text: 'OK', onPress: () => setModalVisible(false) }
      ]);
    }
  };

  const uploadClothing = async (retryCount = 0) => {
    console.log('uploadClothing called with data:', clothingData);
    console.log('Has image:', !!selectedImage);
    
    if (!selectedImage || !clothingData.nome || !clothingData.tipo || 
        !clothingData.cor || !clothingData.estilo) {
      showModal('error', 'Campos Obrigatórios', 'Por favor, preencha todos os campos e selecione uma imagem.', [
        { text: 'OK', onPress: () => setModalVisible(false) }
      ]);
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        showModal('error', 'Erro de Autenticação', 'Token de autenticação não encontrado.', [
          { text: 'OK', onPress: () => setModalVisible(false) }
        ]);
        setLoading(false);
        return;
      }

      console.log('Uploading clothing - attempt:', retryCount + 1);
      console.log('Image size:', selectedImage.length, 'characters');
      console.log('Clothing data:', clothingData);

      // Create request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/upload-roupa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.trim()}`, // Trim token to avoid extra spaces
        },
        body: JSON.stringify({
          ...clothingData,
          imagem_original: selectedImage,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('Success response:', data);
        showModal('success', 'Sucesso!', 'Roupa adicionada com sucesso!', [
          { 
            text: 'Ver no Guarda-roupa', 
            onPress: () => {
              setModalVisible(false);
              router.push('/my-wardrobe' as any);
            },
            style: 'primary'
          },
          { 
            text: 'Adicionar Outra', 
            onPress: () => {
              setModalVisible(false);
              // Reset form for adding another item
              setSelectedImage('');
              setClothingData({
                nome: '',
                tipo: '',
                cor: '',
                estilo: '',
              });
            },
            style: 'secondary'
          }
        ]);
        return;
      } 
      
      const errorText = await response.text();
      console.log('Error response:', errorText);

      // Handle specific error cases
      if (response.status === 403) {
        console.log('403 Forbidden - attempting retry...');
        if (retryCount < 2) {
          setLoading(false);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          return uploadClothing(retryCount + 1); // Retry
        } else {
          showModal('error', 'Erro de Autenticação', 'Problema de autenticação. Tente fazer login novamente.', [
            { text: 'OK', onPress: () => setModalVisible(false) }
          ]);
        }
      } else if (response.status === 401) {
        showModal('error', 'Sessão Expirada', 'Sua sessão expirou. Faça login novamente.', [
          { text: 'OK', onPress: () => setModalVisible(false) }
        ]);
      } else {
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText || 'Erro desconhecido' };
        }
        showModal('error', 'Erro no Upload', errorData.detail || `Erro ${response.status}: ${response.statusText}`, [
          { text: 'OK', onPress: () => setModalVisible(false) }
        ]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      if (error.name === 'AbortError') {
        showModal('error', 'Timeout', 'Upload cancelado por timeout. Tente novamente com uma imagem menor.', [
          { text: 'OK', onPress: () => setModalVisible(false) }
        ]);
      } else if (retryCount < 2) {
        console.log('Connection error - attempting retry...');
        setLoading(false);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return uploadClothing(retryCount + 1);
      } else {
        showModal('error', 'Erro de Conexão', 'Erro de conexão após várias tentativas. Verifique sua internet e tente novamente.', [
          { text: 'OK', onPress: () => setModalVisible(false) }
        ]);
      }
    } finally {
      setLoading(false);
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
        <Text style={styles.headerTitle}>Adicionar Roupa</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Image Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Foto da Roupa</Text>
          
          {selectedImage ? (
            <View style={styles.selectedImageContainer}>
              <View style={styles.selectedImageWithPhoto}>
                <Image 
                  source={{ uri: selectedImage }} 
                  style={styles.selectedImagePhoto}
                  resizeMode="cover"
                />
                <Text style={styles.imageSelectedText}>Imagem selecionada ✓</Text>
              </View>
              <TouchableOpacity 
                style={styles.changeImageButton}
                onPress={selectImage}
              >
                <Text style={styles.changeImageText}>Alterar foto</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imageButtonsContainer}>
              <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                <Ionicons name="camera" size={32} color="#6c5ce7" />
                <Text style={styles.imageButtonText}>Tirar Foto</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.imageButton} onPress={selectImage}>
                <Ionicons name="images" size={32} color="#00b894" />
                <Text style={styles.imageButtonText}>Da Galeria</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Clothing Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalhes da Roupa</Text>
          
          {/* Nome */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nome da roupa</Text>
            <View style={styles.inputWrapper}>
              <Text 
                style={styles.inputText}
                onPress={() => {
                  Alert.prompt(
                    'Nome da roupa',
                    'Digite o nome da roupa:',
                    (text) => setClothingData(prev => ({ ...prev, nome: text || '' }))
                  );
                }}
              >
                {clothingData.nome || 'Ex: Camisa azul listrada'}
              </Text>
            </View>
          </View>

          {/* Tipo */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Tipo de roupa</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
              {CLOTHING_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.optionChip,
                    clothingData.tipo === type.id && styles.selectedChip
                  ]}
                  onPress={() => setClothingData(prev => ({ ...prev, tipo: type.id }))}
                >
                  <Ionicons 
                    name={type.icon} 
                    size={16} 
                    color={clothingData.tipo === type.id ? '#fff' : '#999'} 
                  />
                  <Text style={[
                    styles.optionText,
                    clothingData.tipo === type.id && styles.selectedText
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Cor */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Cor principal</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
              {CLOTHING_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.optionChip,
                    clothingData.cor === color && styles.selectedChip
                  ]}
                  onPress={() => setClothingData(prev => ({ ...prev, cor: color }))}
                >
                  <Text style={[
                    styles.optionText,
                    clothingData.cor === color && styles.selectedText
                  ]}>
                    {color}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Estilo */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Estilo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
              {CLOTHING_STYLES.map((style) => (
                <TouchableOpacity
                  key={style}
                  style={[
                    styles.optionChip,
                    clothingData.estilo === style && styles.selectedChip
                  ]}
                  onPress={() => setClothingData(prev => ({ ...prev, estilo: style }))}
                >
                  <Text style={[
                    styles.optionText,
                    clothingData.estilo === style && styles.selectedText
                  ]}>
                    {style}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={uploadClothing}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Salvando...' : 'Salvar Roupa'}
          </Text>
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
    marginBottom: 20,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  imageButton: {
    flex: 1,
    backgroundColor: '#2d3436',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#636e72',
    borderStyle: 'dashed',
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  selectedImageContainer: {
    alignItems: 'center',
  },
  selectedImagePlaceholder: {
    width: width - 40,
    height: 200,
    backgroundColor: '#2d3436',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00b894',
  },
  selectedImageWithPhoto: {
    width: width - 40,
    height: 220,
    backgroundColor: '#2d3436',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#00b894',
  },
  selectedImagePhoto: {
    width: '100%',
    height: 180,
    backgroundColor: '#2d3436',
  },
  imageSelectedText: {
    color: '#00b894',
    fontSize: 18,
    fontWeight: 'bold',
  },
  changeImageButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#636e72',
    borderRadius: 8,
  },
  changeImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputWrapper: {
    backgroundColor: '#2d3436',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#636e72',
  },
  inputText: {
    color: '#fff',
    fontSize: 16,
  },
  optionsScroll: {
    marginTop: 4,
  },
  optionChip: {
    backgroundColor: '#2d3436',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#636e72',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedChip: {
    backgroundColor: '#6c5ce7',
    borderColor: '#6c5ce7',
  },
  optionText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedText: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#6c5ce7',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    backgroundColor: '#636e72',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});