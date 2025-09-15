import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Animated, // Import Animated
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useState, useRef, useEffect } from 'react'; // Import useRef and useEffect
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ResultScreen from './screens/ResultScreen'; // Make sure this path is correct

const Stack = createStackNavigator();

// A custom animated button component for a consistent look and feel
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

  // Runs animations
  const runAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Trigger animation on first load
  useEffect(() => {
    runAnimation();
  }, []);

  // Reset and run animation when the view changes
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    runAnimation();
  }, [selectedImageUri]);

  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Set to false to avoid the cropping issue
      aspect: [4, 3],
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

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: false, // Set to false to avoid the cropping issue
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

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
      const response = await fetch('https://tenia-kurapati-mini-backend.hf.space/predict', {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const responseData = await response.json();
      setIsLoading(false);
      navigation.navigate('Result', { imageUri: selectedImageUri, predictionData: responseData });
      setSelectedImageUri(null); // Reset after navigation
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
            <Text style={styles.title}>Leaf Classifier</Text>
            <Text style={styles.subtitle}>Identify medicinal plants from a photo.</Text>

            <AnimatedButton title="Take a Picture" onPress={takePictureWithCamera} />
            <AnimatedButton
              title="Pick from Gallery"
              onPress={pickImageFromGallery}
              style={styles.secondaryButton}
              textStyle={styles.secondaryButtonText}
            />
          </>
        ) : (
          <>
            <Text style={styles.title}>Image Preview</Text>
            <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
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

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#f8f9fa' },
          headerTintColor: '#333',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
        <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Analysis Result' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Softer background color
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
    marginBottom: 40,
    textAlign: 'center',
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
    width: 320,
    height: 320,
    resizeMode: 'contain',
    marginBottom: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});