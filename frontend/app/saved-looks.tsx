import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  Image,
  Modal,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { BACKEND_URL } from '../config/api';

interface Look {
  id: string;
  nome: string;
  roupas_ids: string[];
  ocasiao: string;
  clima?: string;
  favorito: boolean;
  imagem_look?: string;
  sugestao_ia?: string;  // Texto da sugestão gerado pela IA
  created_at: string;
}

interface ClothingItem {
  id: string;
  nome: string;
  tipo: string;
  cor: string;
  estilo: string;
  imagem_original: string;
}

export default function SavedLooks() {
  const [looks, setLooks] = useState<Look[]>([]);
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('todos');
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalLooks, setTotalLooks] = useState(0);
  
  const ITEMS_PER_PAGE = 20;

  const filters = [
    { id: 'todos', label: 'Todos' },
    { id: 'favoritos', label: 'Favoritos' },
    { id: 'trabalho', label: 'Trabalho' },
    { id: 'casual', label: 'Casual' },
    { id: 'festa', label: 'Festa' },
    { id: 'esporte', label: 'Esporte' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (resetPage: boolean = false) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        Alert.alert('Erro', 'Token de autenticação não encontrado.');
        return;
      }

      const currentPage = resetPage ? 0 : page;
      const skip = currentPage * ITEMS_PER_PAGE;

      // Fetch looks with pagination
      const looksResponse = await fetch(
        `${BACKEND_URL}/api/looks?skip=${skip}&limit=${ITEMS_PER_PAGE}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      // Fetch ALL clothing items (não paginado pois é usado como referência)
      const clothesResponse = await fetch(`${BACKEND_URL}/api/roupas?skip=0&limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (looksResponse.ok && clothesResponse.ok) {
        const looksData = await looksResponse.json();
        const clothesData = await clothesResponse.json();
        
        console.log('✅ Looks carregados:', looksData.items.length, 'Total:', looksData.total);
        
        if (resetPage) {
          setLooks(looksData.items);
          setPage(0);
        } else {
          // Avoid duplicates by filtering out items that already exist
          setLooks(prev => {
            const existingIds = new Set(prev.map(item => item.id));
            const newItems = looksData.items.filter((item: any) => !existingIds.has(item.id));
            return [...prev, ...newItems];
          });
        }
        
        setClothingItems(clothesData.items || clothesData);
        setHasMore(looksData.has_more);
        setTotalLooks(looksData.total);
        
        if (!resetPage) {
          setPage(currentPage + 1);
        }
      } else {
        Alert.alert('Erro', 'Erro ao carregar dados.');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Erro', 'Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const toggleFavorite = async (lookId: string) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(
        `${BACKEND_URL}/api/looks/${lookId}/favoritar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setLooks(prevLooks =>
          prevLooks.map(look =>
            look.id === lookId
              ? { ...look, favorito: !look.favorito }
              : look
          )
        );
      } else {
        Alert.alert('Erro', 'Erro ao atualizar favorito.');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Erro', 'Erro de conexão. Tente novamente.');
    }
  };

  const deleteLook = async (lookId: string, lookName: string) => {
    Alert.alert(
      'Excluir look',
      `Tem certeza que deseja excluir "${lookName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('auth_token');
              if (!token) return;

              const response = await fetch(
                `${BACKEND_URL}/api/looks/${lookId}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                }
              );

              if (response.ok) {
                setLooks(prev => prev.filter(look => look.id !== lookId));
                Alert.alert('Sucesso', 'Look excluído com sucesso!');
              } else {
                Alert.alert('Erro', 'Erro ao excluir look.');
              }
            } catch (error) {
              console.error('Error deleting look:', error);
              Alert.alert('Erro', 'Erro de conexão. Tente novamente.');
            }
          }
        }
      ]
    );
  };

  const loadMoreLooks = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      fetchData(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    fetchData(true);
  };

  const getClothingDetails = (clothingIds: string[]) => {
    return clothingIds.map(id => 
      clothingItems.find(item => item.id === id)
    ).filter(Boolean) as ClothingItem[];
  };

  const filteredLooks = selectedFilter === 'todos' 
    ? looks 
    : selectedFilter === 'favoritos'
    ? looks.filter(look => look.favorito)
    : looks.filter(look => look.ocasiao === selectedFilter);

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
        <Text style={styles.headerTitle}>Looks Salvos</Text>
        <TouchableOpacity onPress={() => router.push('/generate-look' as any)}>
          <Ionicons name="add" size={24} color="#6c5ce7" />
        </TouchableOpacity>
      </View>

      {looks.length === 0 ? (
        <ScrollView 
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={80} color="#636e72" />
            <Text style={styles.emptyTitle}>Nenhum look salvo</Text>
            <Text style={styles.emptySubtitle}>
              Crie e salve seus primeiros looks para vê-los aqui!
            </Text>
            <TouchableOpacity 
              style={styles.generateButton}
              onPress={() => router.push('/generate-look' as any)}
            >
              <Ionicons name="sparkles" size={20} color="#fff" />
              <Text style={styles.generateButtonText}>Gerar primeiro look</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <>
          {/* Stats Section */}
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>Seus looks</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.statsScrollView}
            >
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{looks.length}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{looks.filter(l => l.favorito).length}</Text>
                  <Text style={styles.statLabel}>Favoritos</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{looks.filter(l => l.ocasiao === 'trabalho').length}</Text>
                  <Text style={styles.statLabel}>Trabalho</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{looks.filter(l => l.ocasiao === 'casual').length}</Text>
                  <Text style={styles.statLabel}>Casual</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{looks.filter(l => l.ocasiao === 'festa').length}</Text>
                  <Text style={styles.statLabel}>Festa</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{looks.filter(l => l.ocasiao === 'esporte').length}</Text>
                  <Text style={styles.statLabel}>Esporte</Text>
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

          {/* Looks List */}
          <FlatList
            data={filteredLooks}
            keyExtractor={(item) => item.id}
            renderItem={({ item: look }) => {
              const clothingDetails = getClothingDetails(look.roupas_ids);
              
              return (
                <View style={styles.lookCard}>
                      {/* Look Image (if available) */}
                      {look.imagem_look && (
                        <TouchableOpacity
                          style={styles.lookImageContainer}
                          onPress={() => setFullScreenImage(look.imagem_look!)}
                          activeOpacity={0.8}
                        >
                          <Image
                            source={{ uri: look.imagem_look }}
                            style={styles.lookImage}
                            resizeMode="cover"
                          />
                          <View style={styles.imageOverlay}>
                            <Ionicons name="expand" size={20} color="#fff" />
                            <Text style={styles.imageOverlayText}>Toque para ampliar</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                      
                      <View style={styles.lookHeader}>
                        <View style={styles.lookInfo}>
                          <Text style={styles.lookName}>{look.nome}</Text>
                          <Text style={styles.lookOccasion}>
                            {look.ocasiao}
                            {look.clima && ` • ${look.clima}`}
                            {look.favorito && ' ❤️'}
                          </Text>
                          <Text style={styles.lookDate}>
                            Criado em {new Date(look.created_at).toLocaleDateString('pt-BR')}
                          </Text>
                        </View>
                        
                        <View style={styles.lookActions}>
                          <TouchableOpacity
                            style={styles.favoriteButton}
                            onPress={() => toggleFavorite(look.id)}
                          >
                            <Ionicons 
                              name={look.favorito ? 'heart' : 'heart-outline'} 
                              size={20} 
                              color={look.favorito ? '#e17055' : '#999'} 
                            />
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => deleteLook(look.id, look.nome)}
                          >
                            <Ionicons name="trash-outline" size={20} color="#e17055" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Botão para ver sugestão da IA */}
                      {look.sugestao_ia && (
                        <TouchableOpacity
                          style={styles.aiSuggestionButton}
                          onPress={() => setSelectedSuggestion(look.sugestao_ia!)}
                        >
                          <Ionicons name="sparkles" size={18} color="#6c5ce7" />
                          <Text style={styles.aiSuggestionButtonText}>Ver sugestão da IA</Text>
                          <Ionicons name="chevron-forward" size={18} color="#6c5ce7" />
                        </TouchableOpacity>
                      )}

                      {/* Clothing Items Carousel */}
                      <View style={styles.clothingItemsContainer}>
                        <Text style={styles.clothingItemsTitle}>
                          Peças do look ({clothingDetails.length}):
                        </Text>
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={false}
                          style={styles.clothingCarousel}
                        >
                          {clothingDetails.map((item) => (
                            <TouchableOpacity
                              key={item.id}
                              style={styles.clothingCard}
                              onPress={() => setFullScreenImage(item.imagem_original)}
                              activeOpacity={0.8}
                            >
                              {item.imagem_original ? (
                                <Image
                                  source={{ uri: item.imagem_original }}
                                  style={styles.clothingImage}
                                  resizeMode="cover"
                                />
                              ) : (
                                <View style={styles.clothingPlaceholder}>
                                  <Ionicons name="shirt-outline" size={40} color="#666" />
                                </View>
                              )}
                              <View style={styles.clothingCardInfo}>
                                <Text style={styles.clothingCardName} numberOfLines={1}>
                                  {item.nome}
                                </Text>
                                <Text style={styles.clothingCardDetails} numberOfLines={1}>
                                  {item.tipo} • {item.cor}
                                </Text>
                              </View>
                              <View style={styles.expandIconSmall}>
                                <Ionicons name="expand-outline" size={14} color="#fff" />
                              </View>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                </View>
              );
            }}
            contentContainerStyle={styles.looksContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            onEndReached={loadMoreLooks}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <View style={styles.noResultsContainer}>
                <Ionicons name="search" size={60} color="#636e72" />
                <Text style={styles.noResultsTitle}>
                  Nenhum look encontrado
                </Text>
                <Text style={styles.noResultsSubtitle}>
                  Tente alterar o filtro ou criar mais looks.
                </Text>
              </View>
            }
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color="#6c5ce7" />
                  <Text style={styles.loadingMoreText}>Carregando mais...</Text>
                </View>
              ) : !hasMore && filteredLooks.length > 0 ? (
                <View style={styles.endMessageContainer}>
                  <Text style={styles.endMessageText}>
                    {totalLooks} {totalLooks === 1 ? 'look carregado' : 'looks carregados'}
                  </Text>
                </View>
              ) : null
            }
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      {/* Full Screen Image Modal */}
      <Modal
        visible={fullScreenImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullScreenImage(null)}
      >
        <View style={styles.fullScreenContainer}>
          <TouchableOpacity
            style={styles.fullScreenCloseButton}
            onPress={() => setFullScreenImage(null)}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          
          {fullScreenImage && (
            <Image
              source={{ uri: fullScreenImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
          
          <View style={styles.fullScreenHint}>
            <Text style={styles.fullScreenHintText}>
              Toque no X para fechar
            </Text>
          </View>
        </View>
      </Modal>

      {/* Modal de Sugestão da IA */}
      <Modal
        visible={selectedSuggestion !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedSuggestion(null)}
      >
        <View style={styles.aiModalOverlay}>
          <View style={styles.aiModalContainer}>
            <View style={styles.aiModalHeader}>
              <View style={styles.aiModalTitleContainer}>
                <Ionicons name="sparkles" size={24} color="#6c5ce7" />
                <Text style={styles.aiModalTitle}>Sugestão da IA</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedSuggestion(null)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.aiModalContent}>
              <Text style={styles.aiModalText}>{selectedSuggestion}</Text>
            </ScrollView>
            
            <TouchableOpacity
              style={styles.aiModalCloseButton}
              onPress={() => setSelectedSuggestion(null)}
            >
              <Text style={styles.aiModalCloseButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
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
  generateButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
  },
  generateButtonText: {
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
  statsScrollView: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
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
  looksContainer: {
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
  lookCard: {
    backgroundColor: '#2d3436',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  lookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  lookInfo: {
    flex: 1,
    paddingRight: 16,
  },
  lookName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lookOccasion: {
    color: '#6c5ce7',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  lookDate: {
    color: '#666',
    fontSize: 12,
  },
  lookActions: {
    flexDirection: 'row',
    gap: 12,
  },
  favoriteButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  clothingItemsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#636e72',
    paddingTop: 16,
  },
  clothingItemsTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  clothingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  clothingItemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6c5ce7',
    marginRight: 12,
  },
  clothingItemText: {
    color: '#999',
    fontSize: 14,
  },
  clothingCarousel: {
    marginTop: 8,
  },
  clothingCard: {
    width: 120,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#636e72',
    position: 'relative',
  },
  clothingImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#636e72',
  },
  clothingPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#636e72',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clothingCardInfo: {
    padding: 10,
  },
  clothingCardName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  clothingCardDetails: {
    color: '#999',
    fontSize: 11,
  },
  expandIconSmall: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(108, 92, 231, 0.9)',
    borderRadius: 14,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lookImageContainer: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  lookImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imageOverlayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  fullScreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
  fullScreenHint: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  fullScreenHintText: {
    color: '#fff',
    fontSize: 14,
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
  // Estilos do botão de sugestão da IA
  aiSuggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    borderWidth: 1,
    borderColor: '#6c5ce7',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  aiSuggestionButtonText: {
    color: '#6c5ce7',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  // Estilos do modal de sugestão da IA
  aiModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  aiModalContainer: {
    backgroundColor: '#2d3436',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    borderWidth: 2,
    borderColor: '#6c5ce7',
  },
  aiModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#636e72',
  },
  aiModalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiModalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  aiModalContent: {
    padding: 20,
    maxHeight: 400,
  },
  aiModalText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  aiModalCloseButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginVertical: 20,
    alignItems: 'center',
  },
  aiModalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});