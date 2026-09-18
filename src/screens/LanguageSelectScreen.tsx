import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { SupportedLanguage } from '../i18n/translations';

interface LanguageSelectScreenProps {
  initialLanguage?: SupportedLanguage;
  onLanguageSelected: (lang: SupportedLanguage) => void;
}

export const LanguageSelectScreen: React.FC<LanguageSelectScreenProps> = ({
  initialLanguage = 'hi',
  onLanguageSelected,
}) => {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(initialLanguage);

  const handleContinue = () => {
    onLanguageSelected(selectedLang);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.content}>
        {/* 1. Official Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../../assets/YojnaLogo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandTitle}>YojnaMitra</Text>
          <Text style={styles.brandSubtitle}>
            योजना मित्र • Citizen Welfare Assistant
          </Text>
        </View>

        {/* 2. Main Title & Instructions */}
        <View style={styles.titleSection}>
          <Text style={styles.headlineHi}>अपनी पसंदीदा भाषा चुनें</Text>
          <Text style={styles.headlineEn}>Choose your preferred language</Text>
          <Text style={styles.helperText}>
            You can change this anytime from your Profile settings.
          </Text>
        </View>

        {/* 3. The 2 Core Language Cards: Hindi & English */}
        <View style={styles.cardsContainer}>
          {/* Hindi Option */}
          <TouchableOpacity
            style={[
              styles.languageCard,
              selectedLang === 'hi' && styles.languageCardActive,
            ]}
            onPress={() => setSelectedLang('hi')}
            activeOpacity={0.85}
          >
            <View style={styles.cardLeft}>
              <View
                style={[
                  styles.scriptCircle,
                  selectedLang === 'hi' && styles.scriptCircleActive,
                ]}
              >
                <Text
                  style={[
                    styles.scriptText,
                    selectedLang === 'hi' && styles.scriptTextActive,
                  ]}
                >
                  अ
                </Text>
              </View>

              <View style={styles.cardTexts}>
                <View style={styles.langNameRow}>
                  <Text
                    style={[
                      styles.langName,
                      selectedLang === 'hi' && styles.langNameActive,
                    ]}
                  >
                    हिन्दी
                  </Text>
                  <Text style={styles.nativeTag}>Hindi</Text>
                </View>
                <Text style={styles.langDesc}>
                  सरकारी योजनाएं और सेवाएं सरल हिन्दी में
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.radioCircle,
                selectedLang === 'hi' && styles.radioCircleActive,
              ]}
            >
              {selectedLang === 'hi' && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>

          {/* English Option */}
          <TouchableOpacity
            style={[
              styles.languageCard,
              selectedLang === 'en' && styles.languageCardActive,
            ]}
            onPress={() => setSelectedLang('en')}
            activeOpacity={0.85}
          >
            <View style={styles.cardLeft}>
              <View
                style={[
                  styles.scriptCircle,
                  selectedLang === 'en' && styles.scriptCircleActive,
                ]}
              >
                <Text
                  style={[
                    styles.scriptText,
                    selectedLang === 'en' && styles.scriptTextActive,
                  ]}
                >
                  A
                </Text>
              </View>

              <View style={styles.cardTexts}>
                <View style={styles.langNameRow}>
                  <Text
                    style={[
                      styles.langName,
                      selectedLang === 'en' && styles.langNameActive,
                    ]}
                  >
                    English
                  </Text>
                  <Text style={styles.nativeTag}>अंग्रेजी</Text>
                </View>
                <Text style={styles.langDesc}>
                  Access all welfare schemes & services in English
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.radioCircle,
                selectedLang === 'en' && styles.radioCircleActive,
              ]}
            >
              {selectedLang === 'en' && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* 4. Mitra AI Voice Capability Note */}
        <View style={styles.aiNoteCard}>
          <Ionicons name="sparkles" size={18} color={Colors.orange.primary} />
          <Text style={styles.aiNoteText}>
            {selectedLang === 'hi'
              ? 'मित्र AI आपसे हिन्दी में बोलकर बात करेगा और योजनाएं समझाएगा।'
              : 'Mitra AI will assist and speak with you in English.'}
          </Text>
        </View>

        {/* 5. Big Bottom Action Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.continueButtonText}>
              {selectedLang === 'hi' ? 'आगे बढ़ें (जारी रखें)' : 'Continue to YojnaMitra'}
            </Text>
            <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'android' ? 24 : 16,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },

  // 1. Brand Header
  brandHeader: {
    alignItems: 'center',
    marginTop: 10,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  logoImage: {
    width: 52,
    height: 52,
    marginTop: 6,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0A2540',
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    fontWeight: '500',
  },

  // 2. Title Section
  titleSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 14,
  },
  headlineHi: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  headlineEn: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },

  // 3. Language Cards
  cardsContainer: {
    gap: 14,
    marginVertical: 10,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  languageCardActive: {
    borderColor: '#0A2540',
    backgroundColor: '#F8FAFC',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  scriptCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  scriptCircleActive: {
    backgroundColor: '#0A2540',
  },
  scriptText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A2540',
  },
  scriptTextActive: {
    color: '#FFFFFF',
  },
  cardTexts: {
    flex: 1,
  },
  langNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  langName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  langNameActive: {
    color: '#0A2540',
  },
  nativeTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  langDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  radioCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#0A2540',
    backgroundColor: '#0A2540',
  },

  // 4. Mitra AI Note
  aiNoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 8,
  },
  aiNoteText: {
    fontSize: 12,
    color: '#C2410C',
    fontWeight: '600',
    flex: 1,
    lineHeight: 17,
  },

  // 5. Bottom Section
  bottomSection: {
    marginTop: 10,
  },
  continueButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.orange.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
