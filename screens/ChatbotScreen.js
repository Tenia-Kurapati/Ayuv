import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ChatbotScreen({ navigation }) {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hi! I'm your Ayurvedic assistant. Please describe your symptoms (e.g., 'I have a dry cough and throat pain'), and I'll recommend some medicinal leaves for you.",
      isUser: false,
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef();

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessageText = inputText;
    const userMessage = {
      id: Date.now().toString(),
      text: userMessageText,
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // --- BACKEND ENDPOINT ---
      // Use this for local testing (Use your computer's local Wi-Fi IP because 127.0.0.1 loops back to the phone itself):
      // const backendUrl = 'http://192.168.31.178:7860/recommend';
      
      // Paste your deployed URL here (and comment out the local one when deploying):
      const backendUrl = 'https://tenia-kurapati-major-backend.hf.space/recommend';

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_input: userMessageText,
          top_k: 3,
        }),
      });

      // If Android Emulator fetch fails, try localhost or actual IP. Let user know if it fails.
      const data = await response.json();

      let botText = "Here are my top recommendations based on your symptoms:";
      
      let finalBotText = botText;
      let recsList = null;

      if (data.recommendations && data.recommendations.length > 0) {
        recsList = data.recommendations;
      } else {
        finalBotText = "I couldn't find a strong recommendation for those symptoms. Please try describing them differently.";
      }

      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: finalBotText,
        isUser: false,
        recommendations: recsList
      };

      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      console.error(error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I couldn't reach the backend server. Make sure it's running (port 7860) and accessible.",
        isUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderBubble = ({ item }) => (
    <View style={[styles.bubbleWrapper, item.isUser ? styles.bubbleWrapperUser : styles.bubbleWrapperBot]}>
      {!item.isUser && (
        <View style={styles.botAvatar}>
          <Ionicons name="leaf" size={16} color="#fff" />
        </View>
      )}
      <View style={[styles.bubble, item.isUser ? styles.userBubble : styles.botBubble]}>
        <Text style={[styles.bubbleText, item.isUser ? styles.userText : styles.botText, item.recommendations && { marginBottom: 10 }]}>
          {item.text}
        </Text>
        
        {item.recommendations && item.recommendations.map((rec, i) => (
          <View key={i} style={styles.recommendationBlock}>
            <Text style={[styles.botText, styles.leafName]}>
              {rec.rank}. {rec.leaf_name}
            </Text>
            <Text style={styles.botText}>
              <Text style={styles.boldLabel}>Usage:</Text> {rec.usage}
            </Text>
            <Text style={styles.botText}>
              <Text style={styles.boldLabel}>Dosage:</Text> {rec.dosage}
            </Text>
            <Text style={styles.botText}>
              <Text style={styles.boldLabel}>Precautions:</Text> {rec.precautions}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Symptom Assistant</Text>
          <View style={{ width: 24 }} />
        </View>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderBubble}
          contentContainerStyle={styles.chatContainer}
          onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current.scrollToEnd({ animated: true })}
        />
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#28A745" />
            <Text style={styles.loadingText}>Analyzing symptoms...</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Describe your symptoms..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEC',
    ...Platform.select({
      ios: { paddingTop: 40 },
      android: { paddingTop: 30 }
    })
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  chatContainer: {
    padding: 15,
    paddingBottom: 20,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 15,
    width: '100%',
  },
  bubbleWrapperUser: {
    justifyContent: 'flex-end',
  },
  bubbleWrapperBot: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  botAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#28A745',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 5,
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#FFF',
  },
  botText: {
    color: '#333',
    lineHeight: 22,
  },
  recommendationBlock: {
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF'
  },
  leafName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#28A745',
    marginBottom: 4,
  },
  boldLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    paddingHorizontal: 15,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EAEAEC',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 15,
    color: '#333',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#28A745',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#A0D8B0',
  },
});
