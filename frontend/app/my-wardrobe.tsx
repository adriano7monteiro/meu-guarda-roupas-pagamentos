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
  FlatList,
  ActivityIndicator,
  Modal,
  Dimensions,
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
  'camisa': 'shirt-outline',
  'blusinha': 'shirt',
  'cropped': 'cut',
  'calca': 'help',
  'shorts': 'resize',
  'saia': 'woman',
  'vestido': 'woman-outline',
  'sapato': 'footsteps',
  'acessorio': 'watch',
  'jaqueta': 'layers',
};

export default function MyWardrobe() {
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('todos');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const modal = useModal();
  
  const ITEMS_PER_PAGE = 20;
  const { width, height } = Dimensions.get('window');

  const filters = [
    { id: 'todos', label: 'Todos' },
    { id: 'camiseta', label: 'Camisetas' },
    { id: 'camisa', label: 'Camisas' },
    { id: 'blusinha', label: 'Blusinhas' },
    { id: 'cropped', label: 'Cropped' },
    { id: 'calca', label: 'Calças' },
    { id: 'shorts', label: 'Shorts' },
    { id: 'saia', label: 'Saias' },
    { id: 'vestido', label: 'Vestidos' },
    { id: 'sapato', label: 'Sapatos' },
    { id: 'acessorio', label: 'Acessórios' },
    { id: 'jaqueta', label: 'Jaquetas' },
  ];

  useEffect(() => {
    fetchClothingItems();
  }, []);

  const fetchClothingItems = async (resetPage: boolean = false) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        modal.showError('Erro', 'Token de autenticação não encontrado.');
        return;
      }

      const currentPage = resetPage ? 0 : page;
      const skip = currentPage * ITEMS_PER_PAGE;

      const response = await fetch(
        `${BACKEND_URL}/api/roupas?skip=${skip}&limit=${ITEMS_PER_PAGE}`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Roupas carregadas:', data.items.length, 'Total:', data.total);
        
        if (resetPage) {
          setClothingItems(data.items);
          setPage(0);
        } else {
          // Avoid duplicates by filtering out items that already exist
          setClothingItems(prev => {
            const existingIds = new Set(prev.map(item => item.id));
            const newItems = data.items.filter((item: any) => !existingIds.has(item.id));
            return [...prev, ...newItems];
          });
        }
        
        setHasMore(data.has_more);
        setTotalItems(data.total);
        
        if (!resetPage) {
          setPage(currentPage + 1);
        }
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
      setLoadingMore(false);
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
                `${BACKEND_URL}/api/roupas/${itemId}`,
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

  const loadMoreItems = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      fetchClothingItems(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    fetchClothingItems(true);
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
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.clothingCard}>
                {item.imagem_original ? (
                  <TouchableOpacity 
                    onPress={() => setFullScreenImage(item.imagem_original)}
                    activeOpacity={0.8}
                  >
                    <Image 
                      source={{ uri: item.imagem_original }} 
                      style={styles.clothingImage}
                      resizeMode="cover"
                    />
                    <View style={styles.expandIcon}>
                      <Ionicons name="expand-outline" size={16} color="#fff" />
                    </View>
                  </TouchableOpacity>
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
            )}
            contentContainerStyle={styles.itemsContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            onEndReached={loadMoreItems}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <View style={styles.noResultsContainer}>
                <Ionicons name="search" size={60} color="#636e72" />
                <Text style={styles.noResultsTitle}>
                  Nenhuma roupa encontrada
                </Text>
                <Text style={styles.noResultsSubtitle}>
                  Tente alterar o filtro ou adicionar mais roupas.
                </Text>
              </View>
            }
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color="#6c5ce7" />
                  <Text style={styles.loadingMoreText}>Carregando mais...</Text>
                </View>
              ) : !hasMore && filteredItems.length > 0 ? (
                <View style={styles.endMessageContainer}>
                  <Text style={styles.endMessageText}>
                    {totalItems} {totalItems === 1 ? 'roupa carregada' : 'roupas carregadas'}
                  </Text>
                </View>
              ) : null
            }
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

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
          <StatusBar barStyle="light-content" />
          
          <View style={styles.fullScreenHeader}>
            <Text style={styles.fullScreenTitle}>Visualização</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setFullScreenImage(null)}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {fullScreenImage && (
            <Image
              source={{ uri: fullScreenImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
          
          <Text style={styles.fullScreenHint}>
            👆 Toque no X para fechar
          </Text>
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
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  loadingMoreText: {
    color: '#6c5ce7',
    fontSize: 14,
    fontWeight: '600',
  },
  endMessageContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endMessageText: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
  },
  expandIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(108, 92, 231, 0.9)',
    borderRadius: 16,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  fullScreenTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  fullScreenHint: {
    position: 'absolute',
    bottom: 40,
    color: '#fff',
    fontSize: 14,
    opacity: 0.7,
  },
});