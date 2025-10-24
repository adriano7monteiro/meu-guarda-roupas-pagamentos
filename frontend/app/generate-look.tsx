import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView, // 👈 adicionado
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import CustomModal from '../components/CustomModal';
import { useModal } from '../hooks/useModal';
import { BACKEND_URL } from '../config/api';

const OCCASIONS = [
  { id: 'trabalho', label: 'Trabalho', icon: 'briefcase' as const },
  { id: 'casual', label: 'Casual', icon: 'shirt' as const },
  { id: 'festa', label: 'Festa', icon: 'wine' as const },
  { id: 'esporte', label: 'Esporte', icon: 'fitness' as const },
  { id: 'encontro', label: 'Encontro', icon: 'heart' as const },
  { id: 'viagem', label: 'Viagem', icon: 'airplane' as const },
];

const TEMPERATURES = [
  { id: 'muito-frio', label: 'Muito Frio', description: 'Abaixo de 10°C', icon: 'snow' as const },
  { id: 'frio', label: 'Frio', description: '10°C - 18°C', icon: 'cloud' as const },
  { id: 'ameno', label: 'Ameno', description: '18°C - 25°C', icon: 'partly-sunny' as const },
  { id: 'quente', label: 'Quente', description: '25°C - 32°C', icon: 'sunny' as const },
  { id: 'muito-quente', label: 'Muito Quente', description: 'Acima de 32°C', icon: 'thermometer' as const },
];

interface Clothing {
  id: string;
  nome: string;
  tipo: string;
  cor: string;
  estilo: string;
  imagem_original: string;
}

interface LookSuggestion {
  sugestao_texto: string;
  roupas_ids: string[];
  dicas: string;
  ocasiao: string;
  temperatura: string | null;
}

export default function GenerateLook() {
  const [selectedOccasion, setSelectedOccasion] = useState('');
  const [selectedTemperature, setSelectedTemperature] = useState('');
  const [contextDetails, setContextDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<LookSuggestion | null>(null);
  const [userClothes, setUserClothes] = useState<Clothing[]>([]);
  const [suggestedClothes, setSuggestedClothes] = useState<Clothing[]>([]);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const modal = useModal();

  useEffect(() => {
    fetchUserClothes();
  }, []);

  const fetchUserClothes = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${BACKEND_URL}/api/roupas?skip=0&limit=1000`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const clothes = data.items || data;
        setUserClothes(clothes);
      }
    } catch (error) {
      console.error('Error fetching clothes:', error);
    }
  };

  const generateLook = async () => {
    if (!selectedOccasion) {
      modal.showError('Erro', 'Por favor, selecione uma ocasião.');
      return;
    }

    if (userClothes.length === 0) {
      modal.showWarning(
        'Nenhuma roupa encontrada',
        'Você precisa adicionar algumas roupas primeiro para gerar sugestões de looks.',
        [
          { text: 'Cancelar', onPress: () => modal.hideModal() },
          { text: 'Adicionar Roupas', onPress: () => {
            modal.hideModal();
            router.push('/upload-clothes' as any);
          }, style: 'primary' }
        ]
      );
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        modal.showError('Erro', 'Token de autenticação não encontrado.');
        return;
      }

      const formData = new FormData();
      formData.append('ocasiao', selectedOccasion);
      if (selectedTemperature) formData.append('temperatura', selectedTemperature);
      if (contextDetails.trim()) formData.append('detalhes_contexto', contextDetails.trim());

      const response = await fetch(`${BACKEND_URL}/api/sugerir-look`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setSuggestion(data);
        const suggested = userClothes.filter(item => data.roupas_ids.includes(item.id));
        setSuggestedClothes(suggested);
      } else {
        modal.showError('Erro', data.detail || 'Erro ao gerar sugestão de look.');
      }
    } catch (error) {
      console.error('Error generating look:', error);
      modal.showError('Erro', 'Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const saveLook = async () => {
    if (!suggestion) return;
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      const lookData = {
        nome: `Look ${suggestion.ocasiao}`,
        roupas_ids: suggestion.roupas_ids,
        ocasiao: suggestion.ocasiao,
        clima: suggestion.temperatura,
        sugestao_ia: suggestion.sugestao_texto,
      };

      const response = await fetch(`${BACKEND_URL}/api/looks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(lookData),
      });

      if (response.ok) {
        modal.showSuccess('Sucesso', 'Look salvo nos seus favoritos!', [
          { text: 'Ver Looks Salvos', onPress: () => {
            modal.hideModal();
            router.push('/saved-looks' as any);
          }, style: 'primary' },
          { text: 'OK', onPress: () => modal.hideModal() }
        ]);
      } else {
        const errorData = await response.json();
        modal.showError('Erro', errorData.detail || 'Erro ao salvar look.');
      }
    } catch (error) {
      console.error('Error saving look:', error);
      modal.showError('Erro', 'Erro de conexão. Tente novamente.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      {/* 👇 ENVOLVIDO COM KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 80 }}
        >

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Gerar Look</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* --- RESTANTE DO CONTEÚDO SEM ALTERAÇÕES --- */}
          {!suggestion ? (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Para qual ocasião?</Text>
                <View style={styles.optionsGrid}>
                  {OCCASIONS.map((occasion) => (
                    <TouchableOpacity
                      key={occasion.id}
                      style={[
                        styles.optionCard,
                        selectedOccasion === occasion.id && styles.selectedCard
                      ]}
                      onPress={() => setSelectedOccasion(occasion.id)}
                    >
                      <Ionicons
                        name={occasion.icon}
                        size={24}
                        color={selectedOccasion === occasion.id ? '#fff' : '#999'}
                      />
                      <Text
                        style={[
                          styles.optionLabel,
                          selectedOccasion === occasion.id && styles.selectedLabel
                        ]}
                      >
                        {occasion.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Como está o clima?</Text>
                <Text style={styles.sectionSubtitle}>Opcional - ajuda a escolher roupas adequadas</Text>

                {TEMPERATURES.map((temp) => (
                  <TouchableOpacity
                    key={temp.id}
                    style={[
                      styles.temperatureCard,
                      selectedTemperature === temp.id && styles.selectedTemperatureCard
                    ]}
                    onPress={() =>
                      setSelectedTemperature(selectedTemperature === temp.id ? '' : temp.id)
                    }
                  >
                    <View style={styles.temperatureContent}>
                      <Ionicons
                        name={temp.icon}
                        size={20}
                        color={selectedTemperature === temp.id ? '#fff' : '#999'}
                      />
                      <View style={styles.temperatureText}>
                        <Text
                          style={[
                            styles.temperatureLabel,
                            selectedTemperature === temp.id && styles.selectedLabel
                          ]}
                        >
                          {temp.label}
                        </Text>
                        <Text
                          style={[
                            styles.temperatureDescription,
                            selectedTemperature === temp.id && styles.selectedDescription
                          ]}
                        >
                          {temp.description}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Campo de detalhes adicionais */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Detalhes adicionais (opcional)</Text>
                <Text style={styles.sectionSubtitle}>
                  Conte mais sobre o ambiente ou contexto para uma sugestão mais personalizada
                </Text>

                <TextInput
                  style={styles.contextInput}
                  placeholder="Ex: Reunião formal no escritório, jantar romântico, festa ao ar livre..."
                  placeholderTextColor="#666"
                  value={contextDetails}
                  onChangeText={setContextDetails}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                  textAlignVertical="top"
                />

                {contextDetails.length > 0 && (
                  <Text style={styles.charCounter}>{contextDetails.length}/200 caracteres</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.generateButton, loading && styles.disabledButton]}
                onPress={generateLook}
                disabled={loading}
              >
                <Ionicons name="sparkles" size={24} color="#fff" />
                <Text style={styles.generateButtonText}>
                  {loading ? 'Gerando...' : 'Gerar Meu Look'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            // ... resto do conteúdo (sugestão e modal) igual ao seu original ...
            <View style={styles.section}>
              {/* conteúdo igual */}
            </View>
          )}

          <View style={{ height: Platform.OS === 'android' ? 100 : 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomModal
        visible={modal.isVisible}
        type={modal.config.type}
        title={modal.config.title}
        message={modal.config.message}
        buttons={modal.config.buttons}
        onClose={modal.hideModal}
      />

      <Modal
        visible={!!fullScreenImage}
        transparent
        animationType="fade"
        onRequestClose={() => setFullScreenImage(null)}
      >
        {/* Mantém igual */}
      </Modal>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: '#999',
    fontSize: 16,
    marginBottom: 20,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionCard: {
    width: '48%',
    backgroundColor: '#2d3436',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#636e72',
  },
  selectedCard: {
    backgroundColor: '#6c5ce7',
    borderColor: '#6c5ce7',
  },
  optionLabel: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  selectedLabel: {
    color: '#fff',
  },
  temperatureCard: {
    backgroundColor: '#2d3436',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#636e72',
  },
  selectedTemperatureCard: {
    backgroundColor: '#6c5ce7',
    borderColor: '#6c5ce7',
  },
  temperatureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  temperatureText: {
    marginLeft: 12,
    flex: 1,
  },
  temperatureLabel: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
  },
  temperatureDescription: {
    color: '#666',
    fontSize: 14,
    marginTop: 2,
  },
  selectedDescription: {
    color: '#e0d9ff',
  },
  generateButton: {
    backgroundColor: '#6c5ce7',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
  },
  disabledButton: {
    backgroundColor: '#636e72',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  contextInput: {
    backgroundColor: '#2d3436',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#636e72',
  },
  charCounter: {
    color: '#999',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
  suggestionCard: {
    backgroundColor: '#2d3436',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  suggestionTitle: {
    color: '#6c5ce7',
    fontSize: 18,
    fontWeight: 'bold',
  },
  suggestionContent: {
    marginBottom: 16,
  },
  suggestionText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'justify',
  },
  tipsSection: {
    borderTopWidth: 1,
    borderTopColor: '#636e72',
    paddingTop: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  tipsTitle: {
    color: '#fdcb6e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tipsText: {
    color: '#e0d9ff',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'justify',
  },
  clothesSection: {
    marginBottom: 32,
  },
  clothesSectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  clothingItem: {
    backgroundColor: '#2d3436',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clothingInfo: {
    flex: 1,
  },
  clothingName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  clothingDetails: {
    color: '#999',
    fontSize: 14,
  },
  actionButtonsContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#e17055',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#636e72',
    opacity: 0.6,
  },
  newLookButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#6c5ce7',
    marginTop: 12,
  },
  newLookButtonText: {
    color: '#6c5ce7',
    fontSize: 16,
    fontWeight: 'bold',
  },
  visualTryonButton: {
    flex: 1,
    backgroundColor: '#00b894',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  visualTryonButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  visualResultSection: {
    marginBottom: 32,
  },
  visualResultTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  visualResultSubtitle: {
    color: '#00b894',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  visualResultCard: {
    backgroundColor: '#2d3436',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#00b894',
  },
  tryonImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  tryonImage: {
    width: 300,
    height: 400,
    borderRadius: 16,
    backgroundColor: '#636e72',
  },
  visualResultNote: {
    color: '#00b894',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  visualClothingList: {
    marginTop: 12,
  },
  visualClothingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  visualClothingItem: {
    color: '#999',
    fontSize: 14,
    marginBottom: 4,
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imageOverlayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#636e72',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  successDot: {
    backgroundColor: '#00b894',
  },
  warningDot: {
    backgroundColor: '#fdcb6e',
  },
  statusText: {
    color: '#999',
    fontSize: 14,
  },
  imageClickableContainer: {
    position: 'relative',
  },
  clickIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clickHint: {
    color: '#6c5ce7',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  
  // Full screen modal styles
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  fullScreenBackdrop: {
    flex: 1,
  },
  fullScreenContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  fullScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  fullScreenTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  fullScreenImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  fullScreenImage: {
    width: Dimensions.get('window').width - 40,
    height: Dimensions.get('window').height * 0.7,
    maxWidth: 400,
    maxHeight: 600,
  },
  fullScreenFooter: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  fullScreenHint: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  fullScreenCloseButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  fullScreenCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Loading styles for try-on button
  loadingButton: {
    backgroundColor: '#636e72',
  },
  loadingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  
  // Share section styles
  shareSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#636e72',
  },
  shareTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  shareButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  whatsappButton: {
    flex: 1,
    backgroundColor: '#25D366',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  instagramButton: {
    flex: 1,
    backgroundColor: '#E1306C',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // Suggested clothes styles
  clothesScrollView: {
    marginTop: 8,
  },
  suggestedClothingCard: {
    width: 140,
    backgroundColor: '#2d3436',
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#636e72',
  },
  suggestedClothingImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#636e72',
  },
  suggestedClothingPlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: '#636e72',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestedClothingInfo: {
    padding: 12,
  },
  suggestedClothingName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  suggestedClothingDetails: {
    color: '#999',
    fontSize: 12,
  },
  expandIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(108, 92, 231, 0.9)',
    borderRadius: 20,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});