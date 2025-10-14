import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import CustomModal from '../components/CustomModal';
import { useModal } from '../hooks/useModal';

interface ClothingItem {
  id: string;
  nome: string;
  tipo: string;
  cor: string;
  estilo: string;
  imagem_original: string;
  created_at: string;
}

const CLOTHING_TYPE_ICONS: { [key: string]: any } = {
  'camiseta': 'shirt',
  'calca': 'help',
  'vestido': 'woman',
  'sapato': 'footsteps',
  'acessorio': 'watch',
  'jaqueta': 'layers',
};

export default function MyWardrobe() {
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('todos');
  const modal = useModal();

  const filters = [
    { id: 'todos', label: 'Todos' },
    { id: 'camiseta', label: 'Camisetas' },
    { id: 'calca', label: 'Calças' },
    { id: 'vestido', label: 'Vestidos' },
    { id: 'sapato', label: 'Sapatos' },
    { id: 'acessorio', label: 'Acessórios' },
    { id: 'jaqueta', label: 'Jaquetas' },
  ];

  useEffect(() => {
    fetchClothingItems();
  }, []);

  const fetchClothingItems = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        modal.showError('Erro', 'Token de autenticação não encontrado.');
        return;
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/roupas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Roupas carregadas:', data.length);
        setClothingItems(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro ao carregar roupas:', response.status, errorData);
        modal.showError('Erro', errorData.detail || 'Erro ao carregar roupas. Verifique sua conexão.');
      }
    } catch (error) {
      console.error('Error fetching clothing items:', error);
      modal.showError('Erro', 'Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const deleteClothingItem = async (itemId: string, itemName: string) => {
    modal.showWarning(
      'Excluir roupa',
      `Tem certeza que deseja excluir "${itemName}"?`,
      [
        { text: 'Cancelar', onPress: () => modal.hideModal() },
        {
          text: 'Excluir',
          onPress: async () => {
            modal.hideModal();
            try {
              const token = await AsyncStorage.getItem('auth_token');
              if (!token) return;

              const response = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/roupas/${itemId}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                }
              );

              if (response.ok) {
                setClothingItems(prev => prev.filter(item => item.id !== itemId));
                modal.showSuccess('Sucesso', 'Roupa excluída com sucesso!');
              } else {
                modal.showError('Erro', 'Erro ao excluir roupa.');
              }
            } catch (error) {
              console.error('Error deleting clothing item:', error);
              modal.showError('Erro', 'Erro de conexão. Tente novamente.');
            }
          },
          style: 'primary'
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchClothingItems();
  };

  const filteredItems = selectedFilter === 'todos' 
    ? clothingItems 
    : clothingItems.filter(item => item.tipo === selectedFilter);

  const getStatsForType = (type: string) => {
    return clothingItems.filter(item => item.tipo === type).length;
  };

  if (loading) {
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
        <Text style={styles.headerTitle}>Meu Guarda-roupa</Text>
        <TouchableOpacity onPress={() => router.push('/upload-clothes' as any)}>
          <Ionicons name="add" size={24} color="#6c5ce7" />
        </TouchableOpacity>
      </View>

      {clothingItems.length === 0 ? (
        <ScrollView 
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.emptyContainer}>
            <Ionicons name="shirt-outline" size={80} color="#636e72" />
            <Text style={styles.emptyTitle}>Guarda-roupa vazio</Text>
            <Text style={styles.emptySubtitle}>
              Adicione suas primeiras roupas para começar a criar looks incríveis!
            </Text>
            <TouchableOpacity 
              style={styles.addFirstButton}
              onPress={() => router.push('/upload-clothes' as any)}
            >
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.addFirstButtonText}>Adicionar primeira roupa</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <>
          {/* Stats Section */}
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>Resumo do guarda-roupa</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{clothingItems.length}</Text>
                  <Text style={styles.statLabel}>Total de peças</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{getStatsForType('camiseta')}</Text>
                  <Text style={styles.statLabel}>Camisetas</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{getStatsForType('calca')}</Text>
                  <Text style={styles.statLabel}>Calças</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{getStatsForType('sapato')}</Text>
                  <Text style={styles.statLabel}>Sapatos</Text>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Filter Section */}
          <View style={styles.filterSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterChip,
                    selectedFilter === filter.id && styles.selectedFilterChip
                  ]}
                  onPress={() => setSelectedFilter(filter.id)}
                >
                  <Text style={[
                    styles.filterText,
                    selectedFilter === filter.id && styles.selectedFilterText
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Clothing Items List */}
          <ScrollView 
            style={styles.scrollContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.itemsContainer}>
              {filteredItems.length === 0 ? (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="search" size={60} color="#636e72" />
                  <Text style={styles.noResultsTitle}>
                    Nenhuma roupa encontrada
                  </Text>
                  <Text style={styles.noResultsSubtitle}>
                    Tente alterar o filtro ou adicionar mais roupas.
                  </Text>
                </View>
              ) : (
                filteredItems.map((item) => (
                  <View key={item.id} style={styles.clothingCard}>
                    {item.imagem_original ? (
                      <Image 
                        source={{ uri: item.imagem_original }} 
                        style={styles.clothingImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.clothingImagePlaceholder}>
                        <Ionicons 
                          name={CLOTHING_TYPE_ICONS[item.tipo] || 'shirt'} 
                          size={32} 
                          color="#6c5ce7" 
                        />
                      </View>
                    )}
                    
                    <View style={styles.clothingInfo}>
                      <Text style={styles.clothingName}>{item.nome}</Text>
                      <Text style={styles.clothingDetails}>
                        {item.tipo} • {item.cor} • {item.estilo}
                      </Text>
                      <Text style={styles.clothingDate}>
                        Adicionado em {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteClothingItem(item.id, item.nome)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#e17055" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
            
            <View style={{ height: 100 }} />
          </ScrollView>
        </>
      )}
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 100,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 24,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  addFirstButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    backgroundColor: '#2d3436',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    minWidth: 80,
  },
  statNumber: {
    color: '#6c5ce7',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  filterChip: {
    backgroundColor: '#2d3436',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#636e72',
  },
  selectedFilterChip: {
    backgroundColor: '#6c5ce7',
    borderColor: '#6c5ce7',
  },
  filterText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedFilterText: {
    color: '#fff',
  },
  itemsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noResultsTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  noResultsSubtitle: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  clothingCard: {
    backgroundColor: '#2d3436',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clothingImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#636e72',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  clothingImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#636e72',
  },
  clothingInfo: {
    flex: 1,
  },
  clothingName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  clothingDetails: {
    color: '#999',
    fontSize: 14,
    marginBottom: 4,
  },
  clothingDate: {
    color: '#666',
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
});