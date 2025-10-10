import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useModal } from '../hooks/useModal';
import CustomModal from '../components/CustomModal';

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
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<LookSuggestion | null>(null);
  const [userClothes, setUserClothes] = useState<Clothing[]>([]);
  const [suggestedClothes, setSuggestedClothes] = useState<Clothing[]>([]);
  const [visualLookResult, setVisualLookResult] = useState<any>(null);
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

    setLoading(true);

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
        setVisualLookResult(data);
        modal.showSuccess(
          'Try-On Virtual Gerado!', 
          data.note || 'Veja como as roupas ficam em você!',
          [
            { text: 'Ver Resultado', onPress: () => modal.hideModal(), style: 'primary' }
          ]
        );
      } else {
        modal.showError('Erro', data.detail || 'Erro ao gerar try-on visual.');
      }
    } catch (error) {
      console.error('Error generating visual look:', error);
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

      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/looks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome: `Look ${suggestion.ocasiao}`,
          roupas_ids: suggestion.roupas_ids,
          ocasiao: suggestion.ocasiao,
          clima: suggestion.temperatura,
        }),
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
        modal.showError('Erro', 'Erro ao salvar look.');
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
              <Text style={styles.suggestionTitle}>Sugestão da IA:</Text>
              <Text style={styles.suggestionText}>{suggestion.sugestao_texto}</Text>
              
              {suggestion.dicas && (
                <>
                  <Text style={styles.tipsTitle}>Dicas:</Text>
                  <Text style={styles.tipsText}>{suggestion.dicas}</Text>
                </>
              )}
            </View>

            {/* Suggested Clothes */}
            <View style={styles.clothesSection}>
              <Text style={styles.clothesSectionTitle}>Peças Sugeridas:</Text>
              {suggestedClothes.map((item) => (
                <View key={item.id} style={styles.clothingItem}>
                  <View style={styles.clothingInfo}>
                    <Text style={styles.clothingName}>{item.nome}</Text>
                    <Text style={styles.clothingDetails}>
                      {item.tipo} • {item.cor} • {item.estilo}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={styles.saveButton} onPress={saveLook}>
                <Ionicons name="heart" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Salvar Look</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.visualTryonButton} 
                onPress={generateVisualLook}
                disabled={loading}
              >
                <Ionicons name="person" size={20} color="#fff" />
                <Text style={styles.visualTryonButtonText}>Ver em Mim</Text>
              </TouchableOpacity>
            </View>

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
  suggestionCard: {
    backgroundColor: '#2d3436',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  suggestionTitle: {
    color: '#6c5ce7',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  suggestionText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  tipsTitle: {
    color: '#fdcb6e',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tipsText: {
    color: '#e0d9ff',
    fontSize: 15,
    lineHeight: 22,
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
});