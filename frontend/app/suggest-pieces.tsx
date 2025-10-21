import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { BACKEND_URL } from '../config/api';

interface Sugestao {
  peca: string;
  razao: string;
  tag_busca: string;
}

export default function SuggestPieces() {
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSugestoes();
  }, []);

  const fetchSugestoes = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        router.replace('/');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/sugerir-pecas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSugestoes(data.sugestoes || []);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Erro ao carregar sugestões');
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const openShopee = (tagBusca: string) => {
    // Parâmetros de afiliado
    const affiliateParams = 'uls_trackid=540b4olm00r7&utm_campaign=id_YRjxaktr0r&utm_content=----&utm_medium=affiliates&utm_source=an_18366980320&utm_term=duc1utii55v7';
    
    // Monta URL com keyword e parâmetros de afiliado
    const url = `https://shopee.com.br/search?keyword=${encodeURIComponent(tagBusca)}&${affiliateParams}`;
    
    console.log('🔗 Abrindo Shopee com afiliado:', url);
    
    Linking.openURL(url).catch(err => {
      console.error('Error opening URL:', err);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sugerir Peças</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6c5ce7" />
          <Text style={styles.loadingText}>Analisando seu guarda-roupa...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#e17055" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSugestoes}>
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Intro */}
          <View style={styles.introCard}>
            <Ionicons name="bulb-outline" size={32} color="#6c5ce7" />
            <Text style={styles.introTitle}>Peças Sugeridas para Você</Text>
            <Text style={styles.introText}>
              Com base no seu guarda-roupa atual, identificamos peças que complementariam suas roupas.
            </Text>
          </View>

          {/* Sugestões */}
          {sugestoes.map((sugestao, index) => (
            <View key={index} style={styles.suggestionCard}>
              <View style={styles.suggestionHeader}>
                <View style={styles.suggestionIconContainer}>
                  <Ionicons name="shirt-outline" size={24} color="#6c5ce7" />
                </View>
                <View style={styles.suggestionTitleContainer}>
                  <Text style={styles.suggestionTitle}>{sugestao.peca}</Text>
                  <Text style={styles.suggestionTag}>
                    <Ionicons name="search" size={12} color="#999" /> {sugestao.tag_busca}
                  </Text>
                </View>
              </View>

              <Text style={styles.suggestionReason}>{sugestao.razao}</Text>

              <TouchableOpacity
                style={styles.shopButton}
                onPress={() => openShopee(sugestao.tag_busca)}
              >
                <Ionicons name="cart-outline" size={20} color="#fff" />
                <Text style={styles.shopButtonText}>Ver mais</Text>
                <Ionicons name="open-outline" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              💡 Dica: Adicione novas roupas ao seu guarda-roupa para receber sugestões ainda mais personalizadas!
            </Text>
          </View>
        </ScrollView>
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2d3436',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#999',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  errorText: {
    color: '#e17055',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  introCard: {
    backgroundColor: '#2d3436',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6c5ce7',
  },
  introTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  introText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  suggestionCard: {
    backgroundColor: '#2d3436',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#636e72',
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  suggestionIconContainer: {
    backgroundColor: 'rgba(108, 92, 231, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  suggestionTitleContainer: {
    flex: 1,
  },
  suggestionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  suggestionTag: {
    color: '#999',
    fontSize: 12,
  },
  suggestionReason: {
    color: '#b2bec3',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  shopButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#2d3436',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: Platform.OS === 'android' ? 100 : 32,
  },
  footerText: {
    color: '#999',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
