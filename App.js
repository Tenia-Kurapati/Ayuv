import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Animated,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ResultScreen from './screens/ResultScreen';
import EditScreen from './screens/EditScreen';
import ChatbotScreen from './screens/ChatbotScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#000' }
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Edit" component={EditScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
      <Stack.Screen name="Chatbot" component={ChatbotScreen} />
    </Stack.Navigator>
  );
}

// A custom animated button component
const AnimatedButton = ({ onPress, title, style, textStyle }) => (
  <TouchableOpacity onPress={onPress} style={[styles.button, style]}>
    <Text style={[styles.buttonText, textStyle]}>{title}</Text>
  </TouchableOpacity>
);

function HomeScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // Animation runner
  const runAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  };
  
  useEffect(() => { runAnimation(); }, []);
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    runAnimation();
  }, [selectedImageUri]);

  // --- Image Picking and Editing Functions (Now all in HomeScreen) ---

  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  const takePictureWithCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera permissions to make this work!');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!result.canceled) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  const handleRotate = async () => {
    if (!selectedImageUri) return;
    const manipResult = await ImageManipulator.manipulateAsync(
      selectedImageUri,
      [{ rotate: 90 }],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
    );
    setSelectedImageUri(manipResult.uri);
  };

  const handleFlip = async () => {
    if (!selectedImageUri) return;
    const manipResult = await ImageManipulator.manipulateAsync(
      selectedImageUri,
      [{ flip: ImageManipulator.FlipType.Horizontal }],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
    );
    setSelectedImageUri(manipResult.uri);
  };
  


  // --- Backend Submission ---

  const sendImageToBackend = async () => {
    if (!selectedImageUri) return;
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', {
      uri: selectedImageUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    });

    try {
      const response = await fetch('https://tenia-kurapati-major-backend.hf.space/predict', {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const responseData = await response.json();
      setIsLoading(false);
      const imageToNavigate = selectedImageUri;
      setSelectedImageUri(null); // Reset home screen
      navigation.navigate('Result', { imageUri: imageToNavigate, predictionData: responseData });
    } catch (error) {
      setIsLoading(false);
      console.error(error);
      Alert.alert('Error', 'Something went wrong while sending the image.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Analyzing Image...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.contentContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {!selectedImageUri ? (
          <>
            <Image source={require('./assets/icon.png')} style={styles.logo} />
            <Text style={styles.title}>Ayurvedic AI</Text>
            <Text style={styles.subtitle}>Explore medicinal plants and intelligent remedies.</Text>
            
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="leaf-outline" size={24} color="#007AFF" />
                <Text style={styles.cardTitle}>Leaf Classification</Text>
              </View>
              <Text style={styles.cardDesc}>Identify plants visually by uploading or taking a photo.</Text>
              <AnimatedButton title="Take a Picture" onPress={takePictureWithCamera} style={styles.cardButton} />
              <AnimatedButton
                title="Pick from Gallery"
                onPress={pickImageFromGallery}
                style={[styles.secondaryButton, styles.cardButton]}
                textStyle={styles.secondaryButtonText}
              />
            </View>

            <View style={[styles.card, { marginTop: 30 }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="medkit-outline" size={24} color="#28A745" />
                <Text style={styles.cardTitle}>Symptom Checker</Text>
              </View>
              <Text style={styles.cardDesc}>Describe your symptoms to get natural medicinal leaf recommendations.</Text>
              <AnimatedButton
                title="Get Recommendation"
                onPress={() => navigation.navigate('Chatbot')}
                style={[{ backgroundColor: '#28A745' }, styles.cardButton]}
                textStyle={{ color: '#fff' }}
              />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.title}>Edit & Preview</Text>
            <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
            
            {/* --- NEW: In-line Editing Tools --- */}
            <View style={styles.editToolsContainer}>
              <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('Edit', { imageUri: selectedImageUri })}>
                <Ionicons name="crop-outline" size={24} color="#333" />
                <Text style={styles.editButtonText}>Crop</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editButton} onPress={handleRotate}>
                <Ionicons name="reload-outline" size={24} color="#333" />
                <Text style={styles.editButtonText}>Rotate</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editButton} onPress={handleFlip}>
                <Ionicons name="repeat-outline" size={24} color="#333" />
                <Text style={styles.editButtonText}>Flip</Text>
              </TouchableOpacity>
            </View>

            <AnimatedButton title="Analyze Image" onPress={sendImageToBackend} />
            <AnimatedButton
              title="Choose Another"
              onPress={() => setSelectedImageUri(null)}
              style={styles.secondaryButton}
              textStyle={styles.secondaryButtonText}
            />
          </>
        )}
      </Animated.View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}



// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 30, // Reduced from 40 since we added cards
    textAlign: 'center',
  },
  card: {
    width: '95%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  cardButton: {
    width: '100%',
    marginVertical: 6,
  },
  button: {
    width: '90%',
    paddingVertical: 15,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#007AFF',
    elevation: 0,
    shadowOpacity: 0,
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  previewImage: {
    width: '90%',
    aspectRatio: 1, // Start as a square, will contain the image
    marginBottom: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
    resizeMode: 'contain',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  // NEW STYLES for inline tools and modal
  editToolsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    marginVertical: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  editButton: {
    alignItems: 'center',
  },
  editButtonText: {
    marginTop: 5,
    fontSize: 12,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#1C1C1E',
  },
  modalHeaderText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <AppNavigator />
    </NavigationContainer>
  );
}