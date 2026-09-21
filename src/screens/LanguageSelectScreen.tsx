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
import { Ionicons } from '../utils/icons';
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
      {Platform.OS === 'android' && (
        <View style={{ height: StatusBar.currentHeight || 28, backgroundColor: '#FFFFFF' }} />
      )}

      <View style={styles.content}>
        {/* Main Content */}
        <View>
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
          </View>

          {/* 2. Main Title */}
          <View style={styles.titleSection}>
            <Text style={styles.headlineHi}>अपनी भाषा चुनें</Text>
            <Text style={styles.headlineEn}>Choose your language</Text>
          </View>

          {/* 3. The 2 Clean Language Cards: Hindi & English */}
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

                <Text
                  style={[
                    styles.langName,
                    selectedLang === 'hi' && styles.langNameActive,
                  ]}
                >
                  हिन्दी
                </Text>
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

                <Text
                  style={[
                    styles.langName,
                    selectedLang === 'en' && styles.langNameActive,
                  ]}
                >
                  English
                </Text>
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
        </View>

        {/* 4. Bottom Action Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.continueButtonText}>
              {selectedLang === 'hi' ? 'आगे बढ़ें' : 'Continue'}
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
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },

  // 1. Brand Header
  brandHeader: {
    alignItems: 'center',
    marginTop: 10,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  logoImage: {
    width: 54,
    height: 54,
    marginTop: 6,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0A2540',
    letterSpacing: 0.3,
  },

  // 2. Title Section
  titleSection: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  headlineHi: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  headlineEn: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },

  // 3. Language Cards
  cardsContainer: {
    gap: 14,
    marginTop: 8,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 68,
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
    gap: 14,
    flex: 1,
  },
  scriptCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scriptCircleActive: {
    backgroundColor: '#0A2540',
  },
  scriptText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0A2540',
    includeFontPadding: false,
  },
  scriptTextActive: {
    color: '#FFFFFF',
  },
  langName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    includeFontPadding: false,
  },
  langNameActive: {
    color: '#0A2540',
    fontWeight: '800',
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

  // 4. Bottom Action Button
  bottomSection: {
    marginTop: 16,
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
