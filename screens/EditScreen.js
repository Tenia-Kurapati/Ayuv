import React, { useState, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity, ActivityIndicator, Image, Dimensions } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';

// Define our crop ratios for the UI
const CROP_RATIOS = [
  { label: 'Free', value: 0 },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
];

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function EditScreen({ route, navigation }) {
  const { imageUri } = route.params;
  const [currentImageUri, setCurrentImageUri] = useState(imageUri);
  const [aspectRatio, setAspectRatio] = useState(CROP_RATIOS[0].value);
  const [isLoading, setIsLoading] = useState(false);

  // --- Main Actions ---

  const handleRotate = useCallback(async () => {
    try {
      setIsLoading(true);
      const manipResult = await ImageManipulator.manipulateAsync(
        currentImageUri,
        [{ rotate: 90 }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );
      setCurrentImageUri(manipResult.uri);
    } catch (error) {
      console.error('Error rotating image:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentImageUri]);

  const handleFlip = useCallback(async () => {
    try {
      setIsLoading(true);
      const manipResult = await ImageManipulator.manipulateAsync(
        currentImageUri,
        [{ flip: ImageManipulator.FlipType.Horizontal }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );
      setCurrentImageUri(manipResult.uri);
    } catch (error) {
      console.error('Error flipping image:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentImageUri]);

  const handleCrop = useCallback(async () => {
    try {
      setIsLoading(true);
      const manipResult = await ImageManipulator.manipulateAsync(
        currentImageUri,
        [
          {
            crop: {
              originX: 0,
              originY: 0,
              width: aspectRatio ? SCREEN_WIDTH : SCREEN_WIDTH,
              height: aspectRatio ? SCREEN_WIDTH / aspectRatio : SCREEN_WIDTH
            }
          }
        ],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );
      navigation.navigate('Home', { editedImageUri: manipResult.uri });
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentImageUri, aspectRatio, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      {/* --- Header --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Image</Text>
        <TouchableOpacity onPress={handleCrop}>
          <Ionicons name="checkmark" size={30} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* --- The Image Preview --- */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: currentImageUri }}
          style={[
            styles.image,
            aspectRatio !== 0 && { aspectRatio }
          ]}
          resizeMode="contain"
        />
      </View>

      {/* --- Footer Controls --- */}
      <View style={styles.footer}>
        {/* Top row for actions like Rotate and Flip */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleRotate}>
            <Ionicons name="reload-outline" size={24} color="#fff" />
            <Text style={styles.actionText}>Rotate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleFlip}>
            <Ionicons name="repeat-outline" size={24} color="#fff" />
            <Text style={styles.actionText}>Flip</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom row for crop ratios */}
        <View style={styles.ratioRow}>
          {CROP_RATIOS.map((ratio) => (
            <TouchableOpacity
              key={ratio.label}
              style={styles.ratioButton}
              onPress={() => setAspectRatio(ratio.value)}
            >
              <Text style={[styles.ratioText, aspectRatio === ratio.value && styles.selectedRatioText]}>
                {ratio.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Loading indicator for rotate/flip actions */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#1C1C1E',
    zIndex: 10,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.5,
  },
  footer: {
    paddingTop: 10,
    backgroundColor: '#1C1C1E',
    zIndex: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    marginTop: 4,
    fontSize: 12,
  },
  ratioRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 20, // SafeArea for bottom devices
  },
  ratioButton: {
    padding: 10,
  },
  ratioText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
  },
  selectedRatioText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
});