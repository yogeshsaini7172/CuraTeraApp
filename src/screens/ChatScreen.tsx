import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Vibration,
} from 'react-native';
import { Ionicons } from '../utils/icons';
import Speech from '../utils/speech';
import { Colors } from '../theme/colors';

import { SupportedLanguage } from '../i18n/translations';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  lang?: 'hi' | 'en';
  quickReplies?: string[];
  actionType?: 'view_schemes';
}

interface ChatScreenProps {
  onNavigateToSchemes: () => void;
  currentLanguage?: SupportedLanguage;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  onNavigateToSchemes,
  currentLanguage = 'hi',
}) => {
  const isEn = currentLanguage === 'en';
  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Initial welcome message from Mitra AI
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'bot',
      lang: isEn ? 'en' : 'hi',
      text: isEn
        ? 'Welcome! I am your YojnaMitra AI Assistant. 🙏\n\nAsk me anything about government welfare schemes!\n\nShall we start with 3 quick questions to check your eligibility?'
        : 'नमस्ते! मैं आपका योजना मित्र (AI सहायक) हूँ। 🙏\n\nआप मुझसे सरकारी योजनाओं के बारे में कुछ भी पूछ सकते हैं!\n\nक्या हम आपकी पात्रता जांचने के लिए 3 आसान सवाल शुरू करें?',
      quickReplies: isEn
        ? ['Yes, start now 🚀', 'Tell me about schemes']
        : ['हाँ, शुरू करें 🚀', 'योजनाओं के बारे में बताएं'],
    },
  ]);

  // Multilingual profiling questionnaire (Hindi & English)
  const profilingSteps = {
    hi: [
      {
        question: 'पहला सवाल: आपका मुख्य पेशा क्या है?',
        options: ['🌾 किसान / कृषि', '🔨 मजदूर / श्रमिक', '🏪 छोटा दुकानदार', '🎓 विद्यार्थी / युवा'],
      },
      {
        question: 'दूसरा सवाल: आपकी पारिवारिक सालाना आय लगभग कितनी है?',
        options: ['₹1.5 लाख से कम (गरीबी रेखा)', '₹1.5 लाख से ₹3 लाख', '₹3 लाख से ₹5 लाख'],
      },
      {
        question: 'तीसरा सवाल: आप किस प्रकार के मकान में रहते हैं?',
        options: ['🏠 कच्चा मकान / झोपड़ी', '🏢 पक्का मकान', '🚪 किराए का मकान'],
      },
    ],
    en: [
      {
        question: 'Question 1: What is your primary occupation?',
        options: ['🌾 Farmer / Agriculture', '🔨 Daily Wage Worker', '🏪 Small Shopkeeper', '🎓 Student / Youth'],
      },
      {
        question: 'Question 2: What is your approximate annual household income?',
        options: ['Below ₹1.5 Lakh (BPL)', '₹1.5L to ₹3 Lakhs', 'Above ₹3 Lakhs'],
      },
      {
        question: 'Question 3: What type of house do you live in?',
        options: ['🏠 Kutcha House / Hut', '🏢 Pucca / Brick House', '🚪 Rented Accommodation'],
      },
    ],
  };

  // Language detector: Auto-detects Hindi vs English like Google Assistant
  const detectLanguage = (text: string): 'hi' | 'en' => {
    // Check if contains Devanagari script
    const hasDevanagari = /[\u0900-\u097F]/.test(text);
    if (hasDevanagari) return 'hi';

    // Check common Roman Hindi / Hinglish keywords
    const lower = text.toLowerCase();
    const hinglishWords = ['kisan', 'yojna', 'ghar', 'makan', 'paisa', 'chahiye', 'namaste', 'batao', 'kaise', 'haan', 'madad'];
    const isHinglish = hinglishWords.some((w) => lower.includes(w));
    if (isHinglish) return 'hi';

    return 'en';
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Read message aloud using Speech API with detected language code
  const handleSpeak = (text: string, lang: 'hi' | 'en' = 'hi') => {
    Speech.stop();
    Speech.speak(text, {
      language: lang === 'hi' ? 'hi-IN' : 'en-IN',
      pitch: 1.0,
      rate: 0.95,
    });
  };

  // Handle user selecting a quick reply chip or entering text
  const handleProcessUserResponse = (input: string) => {
    const detectedLang = detectLanguage(input);

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: input,
      lang: detectedLang,
    };

    setMessages((prev) => [...prev, userMsg]);

    // Bot response logic tailored to user's language
    setTimeout(() => {
      const steps = profilingSteps[detectedLang];

      if (currentStep < steps.length) {
        const step = steps[currentStep];
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          lang: detectedLang,
          text: step.question,
          quickReplies: step.options,
        };
        setMessages((prev) => [...prev, botMsg]);
        handleSpeak(step.question, detectedLang);
        setCurrentStep((prev) => prev + 1);
      } else {
        // Final congratulations message in matched language
        const finalText =
          detectedLang === 'hi'
            ? '🎉 बधाई हो! आपकी जानकारी के आधार पर आपके लिए 4 प्रमुख योजनाएं 100% पात्र पाई गई हैं:\n\n1. प्रधानमंत्री आवास योजना (ग्रामीण) - ₹1,20,000\n2. पीएम किसान सम्मान निधि - ₹6,000 / वर्ष\n3. आयुष्मान भारत योजना - ₹5,00,000 मुफ्त इलाज\n\nआप अभी इनका विवरण और कागजात देख सकते हैं।'
            : '🎉 Congratulations! Based on your profile, you are 100% eligible for 4 flagship government schemes:\n\n1. Pradhan Mantri Awas Yojana (Rural) - ₹1,20,000\n2. PM-Kisan Samman Nidhi - ₹6,000 / year\n3. Ayushman Bharat Yojana - ₹5 Lakh free health cover\n\nYou can view full details and required documents now.';

        const finalReplies =
          detectedLang === 'hi'
            ? ['📋 मेरी पात्र योजनाएं देखें ↗', 'कागजात चेकलिस्ट देखें']
            : ['📋 View Eligible Schemes ↗', 'Check Required Documents'];

        const finalMsg: ChatMessage = {
          id: `bot-final-${Date.now()}`,
          sender: 'bot',
          lang: detectedLang,
          text: finalText,
          quickReplies: finalReplies,
          actionType: 'view_schemes',
        };
        setMessages((prev) => [...prev, finalMsg]);
        handleSpeak(
          detectedLang === 'hi'
            ? 'बधाई हो! आपकी जानकारी के आधार पर आप 4 प्रमुख योजनाओं के लिए पात्र हैं।'
            : 'Congratulations! You are eligible for 4 major welfare schemes.',
          detectedLang
        );
      }
    }, 600);
  };

  // Toggle Voice Input simulation with Haptic vibration
  const handleToggleVoice = () => {
    Vibration.vibrate(20);
    if (!isListening) {
      setIsListening(true);
      // Simulate speech recognition result after 2.2 seconds
      setTimeout(() => {
        setIsListening(false);
        handleProcessUserResponse('मुझे पक्का मकान और किसान योजना चाहिए');
      }, 2200);
    } else {
      setIsListening(false);
    }
  };

  // Handle typed text submission
  const handleSendText = () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    handleProcessUserResponse(text);
  };

  return (
    <View style={styles.container}>
      {/* Live Matched Schemes Floating Pill */}
      <View style={styles.matchedHeader}>
        <View style={styles.matchedBadge}>
          <View style={styles.greenPulse} />
          <Text style={styles.matchedText}>
            {currentStep >= 3
              ? (isEn ? '🔵 4 Schemes Matched' : '🔵 4 योजनाएं मैच हुईं')
              : (isEn ? '🟠 Matching Eligibility...' : '🟠 पात्रता मिलान जारी है...')}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.schemesButton}
          onPress={onNavigateToSchemes}
        >
          <Text style={styles.schemesButtonText}>
            {isEn ? 'View Schemes ↗' : 'योजनाएं देखें ↗'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Messages Scroll Area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageContent}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubbleWrap,
              msg.sender === 'user' ? styles.userWrap : styles.botWrap,
            ]}
          >
            {/* Bot Avatar */}
            {msg.sender === 'bot' && (
              <View style={styles.botAvatar}>
                <Text style={{ fontSize: 16 }}>🤖</Text>
              </View>
            )}

            {/* Bubble Box */}
            <View
              style={[
                styles.bubble,
                msg.sender === 'user' ? styles.userBubble : styles.botBubble,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  msg.sender === 'user' ? styles.userText : styles.botText,
                ]}
              >
                {msg.text}
              </Text>

              {/* Text-to-Speech audio button on Bot message */}
              {msg.sender === 'bot' && (
                <TouchableOpacity
                  style={styles.speakerRow}
                  onPress={() => handleSpeak(msg.text, msg.lang || (isEn ? 'en' : 'hi'))}
                >
                  <Ionicons name="volume-high" size={16} color={Colors.blue.primary} />
                  <Text style={styles.speakerLabel}>
                    {isEn ? 'Listen Aloud' : 'बोलकर सुनें'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {/* Interactive Quick-Reply Answer Chips */}
        {messages[messages.length - 1]?.quickReplies && (
          <View style={styles.chipsContainer}>
            <Text style={styles.chipsHint}>
              {isEn ? '👇 Select an answer below:' : '👇 नीचे से अपना उत्तर चुनें:'}
            </Text>
            <View style={styles.chipsRow}>
              {messages[messages.length - 1].quickReplies!.map((reply, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.chipButton}
                  onPress={() => {
                    if (reply.includes('योजनाएं देखें') || reply.includes('View Eligible Schemes') || reply.includes('View Schemes')) {
                      onNavigateToSchemes();
                    } else {
                      handleProcessUserResponse(reply);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipButtonText}>{reply}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Listening Wave Notification */}
      {isListening && (
        <View style={styles.listeningNotice}>
          <Ionicons name="mic" size={18} color={Colors.white.pure} />
          <Text style={styles.listeningText}>
            {isEn ? 'Mitra AI is listening... Speak now' : 'मित्र AI आपकी बात सुन रहा है... बोलिए'}
          </Text>
        </View>
      )}

      {/* Bottom Input & Voice Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder={isEn ? 'Type scheme question here...' : 'यहाँ अपना सवाल लिखें या बोलें...'}
          placeholderTextColor={Colors.white.muted}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSendText}
        />

        {inputText.trim().length > 0 ? (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendText}
          >
            <Ionicons name="send" size={18} color={Colors.white.pure} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.micButton,
              isListening && styles.micButtonListening,
            ]}
            onPress={handleToggleVoice}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isListening ? 'radio' : 'mic'}
              size={22}
              color={Colors.white.pure}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white.canvas,
  },
  matchedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white.pure,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.white.border,
  },
  matchedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.orange.primary,
  },
  matchedText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.blue.dark,
  },
  schemesButton: {
    backgroundColor: Colors.blue.light,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  schemesButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.blue.primary,
  },
  messageList: {
    flex: 1,
  },
  messageContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubbleWrap: {
    flexDirection: 'row',
    marginBottom: 14,
    maxWidth: '86%',
  },
  botWrap: {
    alignSelf: 'flex-start',
  },
  userWrap: {
    alignSelf: 'flex-end',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.blue.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  bubble: {
    borderRadius: 16,
    padding: 14,
  },
  botBubble: {
    backgroundColor: Colors.white.pure,
    borderWidth: 1,
    borderColor: Colors.white.border,
    borderTopLeftRadius: 4,
    elevation: 0,
    shadowOpacity: 0,
  },
  userBubble: {
    backgroundColor: Colors.blue.primary,
    borderTopRightRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  botText: {
    color: Colors.white.textDark,
  },
  userText: {
    color: Colors.white.pure,
    fontWeight: '500',
  },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  speakerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.blue.primary,
  },
  chipsContainer: {
    marginTop: 10,
    marginBottom: 14,
  },
  chipsHint: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white.muted,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipButton: {
    backgroundColor: Colors.white.pure,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.blue.primary,
    elevation: 0,
    shadowOpacity: 0,
  },
  chipButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.blue.primary,
  },
  listeningNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.orange.primary,
    paddingVertical: 6,
  },
  listeningText: {
    color: Colors.white.pure,
    fontSize: 12,
    fontWeight: '700',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white.pure,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'android' ? 14 : 26,
    borderTopWidth: 1,
    borderTopColor: Colors.white.border,
    gap: 10,
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 14,
    color: Colors.white.textDark,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.orange.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonListening: {
    backgroundColor: '#C2410C',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.blue.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
