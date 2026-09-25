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
  Keyboard,
  Image,
  TouchableWithoutFeedback,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '../utils/icons';
import Speech from '../utils/speech';
import { SupportedLanguage } from '../i18n/translations';
import { launchImageLibraryAsync, launchCameraAsync } from '../utils/imagePicker';
import { pickDocumentAsync } from '../utils/documentPicker';
import { recognizeSpeech } from '../utils/speechRecognizer';
import { chatApi } from '../api';

interface ChatAttachment {
  uri?: string;
  name: string;
  type: 'image' | 'file';
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  lang?: 'hi' | 'en';
  quickReplies?: string[];
  actionType?: 'view_schemes';
  attachment?: ChatAttachment;
}

interface ChatScreenProps {
  onBack?: () => void;
  onNavigateToSchemes: () => void;
  currentLanguage?: SupportedLanguage;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  onBack,
  onNavigateToSchemes,
  currentLanguage = 'hi',
}) => {
  const isEn = currentLanguage === 'en';
  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [pendingAttachment, setPendingAttachment] = useState<ChatAttachment | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 1-line crisp greeting like ChatGPT (no paragraphs or overwhelming text)
  const initialBotMessage: ChatMessage = {
    id: 'msg-1',
    sender: 'bot',
    lang: isEn ? 'en' : 'hi',
    text: isEn
      ? 'Hello! How can I help you today?'
      : 'नमस्ते! मैं आपकी क्या सहायता कर सकता हूँ?',
    quickReplies: isEn
      ? ['Check Eligibility 🔍', 'Explore Schemes 📋']
      : ['पात्रता जांचें 🔍', 'सरकारी योजनाएं 📋'],
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialBotMessage]);

  // Keyboard height listener to smoothly elevate input pill
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Text-to-speech helper: speaks aloud via native Android TTS engine
  const handleSpeak = (text: string, lang: SupportedLanguage | 'hi' | 'en') => {
    Speech.stop();
    setIsSpeaking(true);
    // Remove emojis and symbols for crisp TTS
    const cleanText = text.replace(/[^\w\s\u0900-\u097F₹,.]/gi, '').trim();
    Speech.speak(cleanText, {
      language: lang === 'hi' ? 'hi' : 'en',
      pitch: 1.0,
      rate: 0.95,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  // Speak welcome message aloud when screen opens
  useEffect(() => {
    const welcomeTimer = setTimeout(() => {
      handleSpeak(initialBotMessage.text, currentLanguage);
    }, 450);

    return () => {
      clearTimeout(welcomeTimer);
      Speech.stop();
      setIsSpeaking(false);
    };
  }, [currentLanguage]);

  // Multilingual profiling questionnaire
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

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Top header actions: Toggle speaker sound
  const handleToggleSpeaker = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      const lastBotMsg = [...messages].reverse().find((m) => m.sender === 'bot');
      if (lastBotMsg) {
        handleSpeak(lastBotMsg.text, currentLanguage);
      }
    }
  };

  // Top header actions: Reset conversation
  const handleRefreshChat = () => {
    Speech.stop();
    setIsSpeaking(false);
    Vibration.vibrate(40);
    setCurrentStep(0);
    setInputText('');
    setPendingAttachment(null);
    setShowAttachmentMenu(false);
    setMessages([initialBotMessage]);
    setTimeout(() => {
      handleSpeak(initialBotMessage.text, currentLanguage);
    }, 300);
  };

  // Photo / File Attachment Handlers (ChatGPT-style)
  const handlePickFromCamera = async () => {
    setShowAttachmentMenu(false);
    setTimeout(async () => {
      try {
        const result = await launchCameraAsync();
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setPendingAttachment({
            uri: asset.uri,
            name: asset.fileName || (isEn ? 'Camera_Photo.jpg' : 'कैमरा_फ़ोटो.jpg'),
            type: 'image',
          });
        }
      } catch (err) {
        console.warn('Camera error:', err);
      }
    }, 150);
  };

  const handlePickFromGallery = async () => {
    setShowAttachmentMenu(false);
    setTimeout(async () => {
      try {
        const result = await launchImageLibraryAsync();
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setPendingAttachment({
            uri: asset.uri,
            name: asset.fileName || (isEn ? 'Uploaded_Photo.jpg' : 'गैलरी_फ़ोटो.jpg'),
            type: 'image',
          });
        }
      } catch (err) {
        console.warn('Gallery error:', err);
      }
    }, 150);
  };

  const handlePickDocument = async () => {
    setShowAttachmentMenu(false);
    setTimeout(async () => {
      try {
        const result = await pickDocumentAsync();
        if (!result.cancelled && result.name) {
          setPendingAttachment({
            uri: result.uri,
            name: result.name,
            type: 'file',
          });
        }
      } catch (err) {
        console.warn('Document picker error:', err);
      }
    }, 150);
  };

  // Process user text / quick-replies / attachments
  const handleProcessUserResponse = async (userText: string, attachment?: ChatAttachment) => {
    const textToAnalyze = userText.trim() || (attachment ? attachment.name : '');
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: userText,
      lang: currentLanguage,
      attachment,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage(textToAnalyze);
      
      const botResponse: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        lang: currentLanguage,
        text: response.message,
      };

      setMessages((prev) => [...prev, botResponse]);
      // Speak AI response aloud in user's selected language
      handleSpeak(botResponse.text, currentLanguage);
    } catch (error) {
      console.error('Chat API Error:', error);
      const errorResponse: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        lang: currentLanguage,
        text: isEn ? 'Sorry, I encountered an error while processing your request.' : 'क्षमा करें, आपके अनुरोध को संसाधित करते समय एक त्रुटि हुई।',
      };
      setMessages((prev) => [...prev, errorResponse]);
      handleSpeak(errorResponse.text, currentLanguage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVoice = async () => {
    Speech.stop();
    setIsSpeaking(false);

    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    Vibration.vibrate(40);

    try {
      const recognized = await recognizeSpeech(currentLanguage);
      if (recognized && recognized.trim().length > 0) {
        // Just like YouTube / Google: write spoken text into the input field!
        setInputText(recognized.trim());
      }
    } catch (err: any) {
      console.log('Voice recognition notice:', err);
    } finally {
      setIsListening(false);
    }
  };

  const handleSendText = () => {
    if (!inputText.trim() && !pendingAttachment) return;
    const text = inputText;
    const attachment = pendingAttachment;
    setInputText('');
    setPendingAttachment(null);
    setShowAttachmentMenu(false);
    handleProcessUserResponse(text, attachment || undefined);
  };

  return (
    <View style={styles.container}>
      {/* ── 1. Top Header: Clean, simple (No surrounding color boxes) ── */}
      <View style={styles.chatHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => {
              Speech.stop();
              onBack?.();
            }}
            style={styles.headerIconBtn}
            activeOpacity={0.6}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel={isEn ? 'Go back' : 'पीछे जाएं'}
          >
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.chatHeaderTitle}>CuraTera</Text>
        </View>

        <View style={styles.headerRight}>
          {/* Speaker Icon: Toggle speech audio on / off */}
          <TouchableOpacity
            onPress={handleToggleSpeaker}
            style={styles.headerIconBtn}
            activeOpacity={0.6}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            accessibilityLabel={isEn ? 'Speaker' : 'आवाज़'}
          >
            <Ionicons
              name={isSpeaking ? 'volume-high' : 'volume-medium-outline'}
              size={23}
              color="#0F172A"
            />
          </TouchableOpacity>

          {/* Simple Refresh Button */}
          <TouchableOpacity
            onPress={handleRefreshChat}
            style={styles.headerIconBtn}
            activeOpacity={0.6}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            accessibilityLabel={isEn ? 'Refresh chat' : 'चैट रीफ्रेश करें'}
          >
            <Ionicons name="refresh-outline" size={23} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 2. Messages Scroll Area ── */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubbleWrap,
              msg.sender === 'user' ? styles.userWrap : styles.botWrap,
            ]}
          >
            {/* Bubble Box */}
            <View
              style={[
                styles.bubble,
                msg.sender === 'user' ? styles.userBubble : styles.botBubble,
              ]}
            >
              {/* User Attachment: Image */}
              {msg.attachment?.type === 'image' && msg.attachment.uri && (
                <View style={styles.bubbleImageWrapper}>
                  <Image
                    source={{ uri: msg.attachment.uri }}
                    style={styles.bubbleImage}
                    resizeMode="cover"
                  />
                </View>
              )}

              {/* User Attachment: Document */}
              {msg.attachment?.type === 'file' && (
                <View style={styles.bubbleDocChip}>
                  <Ionicons name="document-text-outline" size={18} color="#0F172A" />
                  <Text style={styles.bubbleDocText} numberOfLines={1}>
                    {msg.attachment.name}
                  </Text>
                </View>
              )}

              {msg.text ? (
                <Text
                  style={[
                    styles.bubbleText,
                    msg.sender === 'user' ? styles.userText : styles.botText,
                  ]}
                >
                  {msg.text}
                </Text>
              ) : null}

              {/* Speaker audio button on AI message */}
              {msg.sender === 'bot' && (
                <TouchableOpacity
                  style={styles.speakerRow}
                  onPress={() => handleSpeak(msg.text, currentLanguage)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="volume-medium-outline" size={16} color="#475569" />
                  <Text style={styles.speakerLabel}>
                    {isEn ? 'Listen Aloud' : 'बोलकर सुनें'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {/* Quick-Reply Answer Chips */}
        {messages[messages.length - 1]?.quickReplies && (
          <View style={styles.chipsContainer}>
            <View style={styles.chipsRow}>
              {messages[messages.length - 1].quickReplies!.map((reply, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.chipButton}
                  onPress={() => {
                    if (
                      reply.includes('योजनाएं देखें') ||
                      reply.includes('View Eligible Schemes') ||
                      reply.includes('View Schemes') ||
                      reply.includes('Explore Schemes')
                    ) {
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

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {isEn ? 'CuraTera AI is typing...' : 'CuraTera AI लिख रहा है...'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Voice Listening Notice */}
      {isListening && (
        <View style={styles.listeningNotice}>
          <Ionicons name="mic" size={18} color="#FFFFFF" />
          <Text style={styles.listeningText}>
            {isEn ? 'CuraTera AI is listening... Speak now' : 'CuraTera AI सुन रहा है... बोलिए'}
          </Text>
        </View>
      )}

      {/* ── 3. Bottom Floating Pill: [ +  Ask anything...    🎙️ ] ── */}
      <View
        style={[
          styles.inputContainer,
          keyboardHeight > 0 && {
            paddingBottom: keyboardHeight + 8,
          },
        ]}
      >
        {/* Attachment preview banner */}
        {pendingAttachment && (
          <View style={styles.pendingAttachmentBanner}>
            <View style={styles.pendingAttachmentInfo}>
              <Ionicons
                name={pendingAttachment.type === 'image' ? 'image-outline' : 'document-text-outline'}
                size={18}
                color="#0A2540"
              />
              <Text style={styles.pendingAttachmentText} numberOfLines={1}>
                {pendingAttachment.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setPendingAttachment(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle-outline" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputPill}>
          {/* Plus icon (Clean, NO surrounding background color box) */}
          <TouchableOpacity
            style={styles.plusBtn}
            onPress={() => {
              Keyboard.dismiss();
              setShowAttachmentMenu((prev) => !prev);
            }}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={isEn ? 'Attach photo or files' : 'फ़ोटो या फ़ाइलें जोड़ें'}
          >
            <Ionicons
              name={showAttachmentMenu ? 'close' : 'add'}
              size={26}
              color="#0F172A"
            />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="Ask anything..."
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSendText}
            returnKeyType="send"
            onFocus={() => setShowAttachmentMenu(false)}
          />

          {inputText.trim().length > 0 || pendingAttachment ? (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleSendText}
              activeOpacity={0.6}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="send" size={20} color="#0A2540" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleToggleVoice}
              activeOpacity={0.6}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={isListening ? 'radio' : 'mic-outline'}
                size={23}
                color={isListening ? '#EA580C' : '#0F172A'}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ChatGPT-style Attachment Popup Menu in Transparent Modal */}
      <Modal
        visible={showAttachmentMenu}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowAttachmentMenu(false)}
      >
        <View style={styles.modalContainer}>
          {/* Backdrop: Touching anywhere outside closes the popup immediately */}
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalBackdrop}
            onPress={() => setShowAttachmentMenu(false)}
          />

          {/* Compact Popup Card positioned above the + button */}
          <View
            style={[
              styles.chatGptMenuCard,
              {
                bottom: (Platform.OS === 'android' ? 14 : 24) + 68,
              },
            ]}
          >
            {/* Camera */}
            <TouchableOpacity
              style={styles.chatGptMenuItem}
              onPress={handlePickFromCamera}
              activeOpacity={0.7}
            >
              <Ionicons name="camera-outline" size={20} color="#0F172A" />
              <Text style={styles.chatGptMenuText}>
                {isEn ? 'Camera' : 'कैमरा'}
              </Text>
            </TouchableOpacity>

            <View style={styles.chatGptMenuDivider} />

            {/* Photos */}
            <TouchableOpacity
              style={styles.chatGptMenuItem}
              onPress={handlePickFromGallery}
              activeOpacity={0.7}
            >
              <Ionicons name="image-outline" size={20} color="#0F172A" />
              <Text style={styles.chatGptMenuText}>
                {isEn ? 'Photos' : 'फ़ोटो'}
              </Text>
            </TouchableOpacity>

            <View style={styles.chatGptMenuDivider} />

            {/* Files */}
            <TouchableOpacity
              style={styles.chatGptMenuItem}
              onPress={handlePickDocument}
              activeOpacity={0.7}
            >
              <Ionicons name="document-text-outline" size={20} color="#0F172A" />
              <Text style={styles.chatGptMenuText}>
                {isEn ? 'Files' : 'फ़ाइलें'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // 1. Header: Simple & Clean (No background boxes around icons)
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 12 : 48,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatHeaderTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },

  // 2. Messages Area
  messageList: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  messageContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubbleWrap: {
    marginBottom: 14,
  },
  botWrap: {
    alignSelf: 'flex-start',
    maxWidth: '88%',
  },
  userWrap: {
    alignSelf: 'flex-end',
    maxWidth: '78%',
  },
  bubble: {
    borderRadius: 18,
    padding: 14,
  },
  // AI Bubble: Simple Light Gray Theme
  botBubble: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  botText: {
    color: '#0F172A',
  },
  userText: {
    color: '#0F172A',
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 10,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
  },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  speakerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },

  // Attachment Bubble Elements
  bubbleImageWrapper: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bubbleImage: {
    width: 200,
    height: 140,
    borderRadius: 12,
  },
  bubbleDocChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 6,
  },
  bubbleDocText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },

  // Quick Reply Chips
  chipsContainer: {
    marginTop: 6,
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0A2540',
  },
  chipButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0A2540',
  },

  // Listening Notice
  listeningNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EA580C',
    paddingVertical: 6,
  },
  listeningText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // 3. Floating Bottom Pill [ +  Ask anything...    🎙️ ]
  inputContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'android' ? 14 : 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    position: 'relative',
    zIndex: 100,
  },
  modalContainer: {
    flex: 1,
    position: 'relative',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  pendingAttachmentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  pendingAttachmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pendingAttachmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0A2540',
    flex: 1,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    height: 50,
  },
  plusBtn: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    paddingVertical: 0,
  },
  actionBtn: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 4. ChatGPT-style Small Floating Card Popover
  chatGptMenuCard: {
    position: 'absolute',
    left: 16,
    width: 155,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 1000,
  },
  chatGptMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 12,
  },
  chatGptMenuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  chatGptMenuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 10,
  },
});
