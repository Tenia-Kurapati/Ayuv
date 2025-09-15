import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Animated, SafeAreaView } from 'react-native';

// A reusable component for displaying a piece of result data in a card.
const ResultCard = ({ title, value, style }) => (
  <View style={[styles.card, style]}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardContent}>{value}</Text>
  </View>
);

export default function ResultScreen({ route }) {
  const { imageUri, predictionData } = route.params;

  // Animation values for a staggered entrance effect
  const animations = useRef([
    new Animated.Value(0), // For the image
    new Animated.Value(0), // For the prediction card
    new Animated.Value(0), // For the confidence card
    new Animated.Value(0), // For the scientific name card
    new Animated.Value(0), // For the medicinal uses card
  ]).current;

  // Staggered animation effect
  useEffect(() => {
    const staggers = animations.map(anim =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    );
    Animated.stagger(100, staggers).start();
  }, []);

  // Helper function to create animated style
  const getAnimatedStyle = (index) => ({
    opacity: animations[index],
    transform: [
      {
        translateY: animations[index].interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0], // Slide up effect
        }),
      },
    ],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View style={getAnimatedStyle(0)}>
          <Image source={{ uri: imageUri }} style={styles.image} />
        </Animated.View>

        {predictionData && (
          <View style={styles.resultsContainer}>
            <Animated.View style={getAnimatedStyle(1)}>
              <ResultCard title="Prediction" value={predictionData.prediction} />
            </Animated.View>

            <Animated.View style={getAnimatedStyle(2)}>
              <ResultCard title="Confidence" value={predictionData.confidence} />
            </Animated.View>

            {predictionData.scientific_name && (
              <Animated.View style={getAnimatedStyle(3)}>
                <ResultCard title="Scientific Name" value={predictionData.scientific_name} />
              </Animated.View>
            )}

            {predictionData.medicinal_uses && predictionData.medicinal_uses.length > 0 && (
              <Animated.View style={[styles.card, getAnimatedStyle(4)]}>
                <Text style={styles.cardTitle}>Medicinal Uses</Text>
                {predictionData.medicinal_uses.map((use, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.listItemText}>{use}</Text>
                  </View>
                ))}
              </Animated.View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  image: {
    width: 320,
    height: 320,
    resizeMode: 'contain',
    marginBottom: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  resultsContainer: {
    width: '100%',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d', // A muted color for the title
    marginBottom: 5,
  },
  cardContent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 5,
  },
  bulletPoint: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 10,
    lineHeight: 24, // Align with text
  },
  listItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    lineHeight: 24,
  },
});