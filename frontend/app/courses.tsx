import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface Course {
  id: string;
  title: string;
  description: string;
  image: string;
  price: string;
  highlights: string[];
}

const courses: Course[] = [
  {
    id: '1',
    title: 'Fundamentos do Estilo Pessoal',
    description: 'Aprenda a identificar seu estilo único e criar looks que expressam sua personalidade. Curso completo com técnicas profissionais de personal styling.',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80',
    price: 'R$ 197,00',
    highlights: ['8 módulos completos', 'Certificado incluso', 'Acesso vitalício'],
  },
  {
    id: '2',
    title: 'Combinação de Cores e Estampas',
    description: 'Domine a arte de combinar cores e estampas como um profissional. Aprenda sobre teoria das cores aplicada à moda e crie looks harmoniosos.',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80',
    price: 'R$ 147,00',
    highlights: ['Guia de cores personalizado', 'Exemplos práticos', 'Suporte por 30 dias'],
  },
  {
    id: '3',
    title: 'Guarda-Roupa Cápsula',
    description: 'Crie um guarda-roupa versátil com peças essenciais que combinam entre si. Economize tempo e dinheiro montando looks incríveis com menos roupas.',
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80',
    price: 'R$ 167,00',
    highlights: ['Lista de peças essenciais', 'Planilha de organização', 'Grupo exclusivo'],
  },
];

export default function Courses() {
  const openWebsite = () => {
    Linking.openURL('https://zenebathos.com.br').catch(err => {
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
        <Text style={styles.headerTitle}>Cursos de Moda</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Ionicons name="sparkles" size={40} color="#6c5ce7" />
          </View>
          <Text style={styles.heroTitle}>Transforme Seu Estilo</Text>
          <Text style={styles.heroSubtitle}>
            Aprenda com especialistas e descubra como se vestir com confiança e elegância
          </Text>
        </View>

        {/* Courses Grid */}
        {courses.map((course) => (
          <View key={course.id} style={styles.courseCard}>
            {/* Course Image */}
            <Image 
              source={{ uri: course.image }} 
              style={styles.courseImage}
              resizeMode="cover"
            />
            
            {/* Course Content */}
            <View style={styles.courseContent}>
              <Text style={styles.courseTitle}>{course.title}</Text>
              <Text style={styles.courseDescription}>{course.description}</Text>
              
              {/* Highlights */}
              <View style={styles.highlightsContainer}>
                {course.highlights.map((highlight, index) => (
                  <View key={index} style={styles.highlightItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#6c5ce7" />
                    <Text style={styles.highlightText}>{highlight}</Text>
                  </View>
                ))}
              </View>

              {/* Price and Button */}
              <View style={styles.courseFooter}>
                <View>
                  <Text style={styles.priceLabel}>Investimento</Text>
                  <Text style={styles.priceValue}>{course.price}</Text>
                </View>
                <TouchableOpacity
                  style={styles.buyButton}
                  onPress={openWebsite}
                >
                  <Text style={styles.buyButtonText}>Comprar Agora</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="shield-checkmark" size={24} color="#6c5ce7" />
          <Text style={styles.footerText}>
            Compra 100% segura • Acesso imediato • Garantia de 7 dias
          </Text>
        </View>
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
  content: {
    flex: 1,
    padding: 16,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  heroIcon: {
    backgroundColor: 'rgba(108, 92, 231, 0.2)',
    borderRadius: 60,
    padding: 20,
    marginBottom: 16,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: '#b2bec3',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  courseCard: {
    backgroundColor: '#2d3436',
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#636e72',
  },
  courseImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#636e72',
  },
  courseContent: {
    padding: 20,
  },
  courseTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 28,
  },
  courseDescription: {
    color: '#b2bec3',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  highlightsContainer: {
    marginBottom: 20,
    gap: 8,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  highlightText: {
    color: '#dfe6e9',
    fontSize: 14,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#636e72',
  },
  priceLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 4,
  },
  priceValue: {
    color: '#6c5ce7',
    fontSize: 24,
    fontWeight: 'bold',
  },
  buyButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#2d3436',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    marginBottom: 32,
  },
  footerText: {
    color: '#b2bec3',
    fontSize: 13,
    textAlign: 'center',
    flex: 1,
  },
});
