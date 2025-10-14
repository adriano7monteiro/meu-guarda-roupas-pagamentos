import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import CustomModal from '../components/CustomModal';
import { useModal } from '../hooks/useModal';

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
  const [visualLookResult, setVisualLookResult] = useState<any>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [tryonLoading, setTryonLoading] = useState(false);
  const modal = useModal();

  useEffect(() => {
    fetchUserClothes();
  }, []);

  const fetchUserClothes = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/roupas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const clothes = await response.json();
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
      if (selectedTemperature) {
        formData.append('temperatura', selectedTemperature);
      }
      if (contextDetails.trim()) {
        formData.append('detalhes_contexto', contextDetails.trim());
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/sugerir-look`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuggestion(data);
        
        // Filter suggested clothes
        const suggested = userClothes.filter(item => 
          data.roupas_ids.includes(item.id)
        );
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

  const generateVisualLook = async () => {
    if (!suggestion) return;

    setTryonLoading(true);

    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        modal.showError('Erro', 'Token de autenticação não encontrado.');
        return;
      }

      const formData = new FormData();
      suggestion.roupas_ids.forEach((id: string) => {
        formData.append('roupa_ids', id);
      });

      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/gerar-look-visual`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Visual look result:', data);
        setVisualLookResult(data);
        modal.showSuccess(
          'Try-On Virtual Gerado!', 
          data.note || 'Veja como as roupas ficam em você!',
          [
            { 
              text: 'Ver Resultado', 
              onPress: () => {
                modal.hideModal();
                // Scroll to the result section after modal closes
                setTimeout(() => {
                  console.log('Result should be visible now');
                }, 300);
              }, 
              style: 'primary' 
            }
          ]
        );
      } else if (response.status === 403) {
        // User hit the free limit, show upgrade modal
        modal.showWarning(
          '🎨 Limite Atingido!',
          'Você já usou seus 5 looks gratuitos. Assine um plano para continuar criando looks ilimitados com IA!',
          [
            {
              text: 'Ver Planos',
              onPress: () => {
                modal.hideModal();
                router.push('/subscription' as any);
              },
              style: 'primary',
            },
            {
              text: 'Depois',
              onPress: () => modal.hideModal(),
            },
          ]
        );
      } else {
        modal.showError('Erro', data.detail || 'Erro ao gerar try-on visual.');
      }
    } catch (error) {
      console.error('Error generating visual look:', error);
      modal.showError('Erro', 'Erro de conexão. Tente novamente.');
    } finally {
      setTryonLoading(false);
    }
  };

  const shareToWhatsApp = async () => {
    try {
      if (!visualLookResult?.tryon_image) return;

      const message = `Olha só meu look criado com IA! 👗✨\n\nCriado pelo app Meu Look IA 🤖`;
      
      if (Platform.OS === 'web') {
        const url = `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}\n\nImagem: ${encodeURIComponent(visualLookResult.tryon_image)}`;
        await Linking.openURL(url);
      } else {
        const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
        const canOpen = await Linking.canOpenURL(url);
        
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          modal.showInfo('WhatsApp', 'WhatsApp não está instalado no seu dispositivo.');
        }
      }
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      modal.showError('Erro', 'Erro ao compartilhar no WhatsApp.');
    }
  };

  const shareToInstagram = async () => {
    try {
      if (!visualLookResult?.tryon_image) return;

      if (Platform.OS === 'web') {
        modal.showInfo(
          'Compartilhar no Instagram',
          'Para compartilhar no Instagram via web, salve a imagem e faça upload manualmente no Instagram.',
          [
            { text: 'Abrir Instagram', onPress: () => {
              modal.hideModal();
              Linking.openURL('https://www.instagram.com');
            }, style: 'primary' },
            { text: 'OK', onPress: () => modal.hideModal() }
          ]
        );
      } else {
        // Para mobile, tentar compartilhar via sistema
        const isAvailable = await Sharing.isAvailableAsync();
        
        if (isAvailable) {
          await Sharing.shareAsync(visualLookResult.tryon_image, {
            mimeType: 'image/png',
            dialogTitle: 'Compartilhar meu look criado com IA!'
          });
        } else {
          const instagramUrl = 'instagram://camera';
          const canOpen = await Linking.canOpenURL(instagramUrl);
          
          if (canOpen) {
            await Linking.openURL(instagramUrl);
          } else {
            modal.showInfo('Instagram', 'Instagram não está instalado no seu dispositivo.');
          }
        }
      }
    } catch (error) {
      console.error('Error sharing to Instagram:', error);
      modal.showError('Erro', 'Erro ao compartilhar no Instagram.');
    }
  };

  const saveLook = async () => {
    if (!suggestion) return;

    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      // Prepare look data
      const lookData: any = {
        nome: `Look ${suggestion.ocasiao}`,
        roupas_ids: suggestion.roupas_ids,
        ocasiao: suggestion.ocasiao,
        clima: suggestion.temperatura,
      };

      // Include try-on image if available
      if (visualLookResult && visualLookResult.tryon_image) {
        lookData.imagem_look = visualLookResult.tryon_image;
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/looks`, {
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
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gerar Look</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {!suggestion ? (
          <>
            {/* Occasion Selection */}
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
                    <Text style={[
                      styles.optionLabel,
                      selectedOccasion === occasion.id && styles.selectedLabel
                    ]}>
                      {occasion.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Temperature Selection */}
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
                  onPress={() => setSelectedTemperature(
                    selectedTemperature === temp.id ? '' : temp.id
                  )}
                >
                  <View style={styles.temperatureContent}>
                    <Ionicons 
                      name={temp.icon} 
                      size={20} 
                      color={selectedTemperature === temp.id ? '#fff' : '#999'} 
                    />
                    <View style={styles.temperatureText}>
                      <Text style={[
                        styles.temperatureLabel,
                        selectedTemperature === temp.id && styles.selectedLabel
                      ]}>
                        {temp.label}
                      </Text>
                      <Text style={[
                        styles.temperatureDescription,
                        selectedTemperature === temp.id && styles.selectedDescription
                      ]}>
                        {temp.description}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Context Details Section */}
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
                <Text style={styles.charCounter}>
                  {contextDetails.length}/200 caracteres
                </Text>
              )}
            </View>

            {/* Generate Button */}
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
          /* Look Suggestion Result */
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sua Sugestão de Look ✨</Text>
            
            {/* AI Suggestion */}
            <View style={styles.suggestionCard}>
              <View style={styles.suggestionHeader}>
                <Ionicons name="sparkles" size={24} color="#6c5ce7" />
                <Text style={styles.suggestionTitle}>Sugestão Personalizada</Text>
              </View>
              
              <View style={styles.suggestionContent}>
                <Text style={styles.suggestionText}>
                  {suggestion.sugestao_texto}
                </Text>
              </View>
              
              {suggestion.dicas && suggestion.dicas.trim() !== '' && (
                <View style={styles.tipsSection}>
                  <View style={styles.tipsHeader}>
                    <Ionicons name="bulb" size={20} color="#fdcb6e" />
                    <Text style={styles.tipsTitle}>Dicas de Estilo</Text>
                  </View>
                  <Text style={styles.tipsText}>{suggestion.dicas}</Text>
                </View>
              )}
            </View>

            {/* Suggested Clothes */}
            <View style={styles.clothesSection}>
              <Text style={styles.clothesSectionTitle}>Peças Sugeridas:</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.clothesScrollView}
              >
                {suggestedClothes.map((item: any) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.suggestedClothingCard}
                    onPress={() => setFullScreenImage(item.imagem_original)}
                    activeOpacity={0.7}
                  >
                    {item.imagem_original ? (
                      <Image 
                        source={{ uri: item.imagem_original }} 
                        style={styles.suggestedClothingImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.suggestedClothingPlaceholder}>
                        <Ionicons name="shirt-outline" size={40} color="#666" />
                      </View>
                    )}
                    <View style={styles.suggestedClothingInfo}>
                      <Text style={styles.suggestedClothingName} numberOfLines={1}>
                        {item.nome}
                      </Text>
                      <Text style={styles.suggestedClothingDetails} numberOfLines={1}>
                        {item.tipo} • {item.cor}
                      </Text>
                    </View>
                    <View style={styles.expandIconContainer}>
                      <Ionicons name="expand-outline" size={16} color="#fff" />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={saveLook}
              >
                <Ionicons name="heart" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Salvar Look</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.newLookButton} 
                onPress={() => {
                  setSuggestion(null);
                  setSuggestedClothes([]);
                }}
              >
                <Ionicons name="refresh" size={20} color="#6c5ce7" />
                <Text style={styles.newLookButtonText}>Novo Look</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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

      {/* Full Screen Image Modal */}
      <Modal
        visible={!!fullScreenImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullScreenImage(null)}
      >
        <View style={styles.fullScreenContainer}>
          <TouchableOpacity 
            style={styles.fullScreenBackdrop}
            onPress={() => setFullScreenImage(null)}
            activeOpacity={1}
          >
            <SafeAreaView style={styles.fullScreenContent}>
              <View style={styles.fullScreenHeader}>
                <Text style={styles.fullScreenTitle}>Visualização - Tela Cheia</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setFullScreenImage(null)}
                >
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
              
              {fullScreenImage && (
                <View style={styles.fullScreenImageContainer}>
                  <Image 
                    source={{ uri: fullScreenImage }} 
                    style={styles.fullScreenImage}
                    resizeMode="contain"
                  />
                </View>
              )}
              
              <View style={styles.fullScreenFooter}>
                <Text style={styles.fullScreenHint}>
                  🔍 Visualização em alta qualidade
                </Text>
                <TouchableOpacity 
                  style={styles.fullScreenCloseButton}
                  onPress={() => setFullScreenImage(null)}
                >
                  <Text style={styles.fullScreenCloseText}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flex: 1,
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
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#6c5ce7',
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