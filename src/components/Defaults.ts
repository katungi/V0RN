import { SnackOptions } from 'snack-sdk';

const defaults: SnackOptions = {
  codeChangesDelay: 500,
  files: {
    'App.js': {
      type: 'CODE',
      contents: `import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const Card = ({ title, description, imageUrl }) => (
  <View style={styles.card}>
    <Image source={{ uri: imageUrl }} style={styles.cardImage} />
    <View style={styles.cardContent}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
    </View>
    <TouchableOpacity style={styles.cardButton}>
      <Text style={styles.cardButtonText}>Learn More</Text>
      <Ionicons name="arrow-forward" size={16} color="#fff" />
    </TouchableOpacity>
  </View>
);

export default function App() {
  const cards = [
    {
      title: 'Modern Design',
      description: 'Clean and minimalist interface with attention to detail',
      imageUrl: 'https://i.pravatar.cc/300?img=1',
    },
    {
      title: 'Responsive Layout',
      description: 'Perfectly adapts to any screen size',
      imageUrl: 'https://i.pravatar.cc/300?img=2',
    },
    {
      title: 'Interactive Elements',
      description: 'Smooth animations and intuitive interactions',
      imageUrl: 'https://i.pravatar.cc/300?img=3',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome</Text>
        <TouchableOpacity>
          <Ionicons name="menu" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {cards.map((card, index) => (
          <Card key={index} {...card} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Constants.statusBarHeight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    marginTop: 8,
  },
  cardButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginRight: 8,
  },
});`,
    },
  },
  dependencies: {
    'expo-av': { version: '*' },
    'expo-font': { version: '*' },
    'expo-app-loading': { version: '*' },
    '@expo/vector-icons': { version: '*' },
  },
};

export default defaults;
