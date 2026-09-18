import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Scheme } from '../types';
import { SupportedLanguage } from '../i18n/translations';

interface SchemeDetailScreenProps {
  scheme: Scheme;
  onBack: () => void;
  currentLanguage: SupportedLanguage;
  isSpeaking: boolean;
  onToggleSpeech: () => void;
  onCallHelpline: (phone: string) => void;
}

export const SchemeDetailScreen: React.FC<SchemeDetailScreenProps> = ({
  scheme,
  onBack,
  currentLanguage,
  isSpeaking,
  onToggleSpeech,
  onCallHelpline,
}) => {
  const isEn = currentLanguage === 'en';

  const title = isEn ? scheme.titleEn : scheme.titleHi;
  const ministry = isEn ? scheme.ministryEn : scheme.ministryHi;
  const categoryLabel = isEn ? scheme.categoryLabelEn : scheme.categoryLabelHi;
  const benefitAmount = isEn
    ? scheme.benefitAmountEn || scheme.benefitAmount
    : scheme.benefitAmountHi || scheme.benefitAmount;
  const benefit = isEn ? scheme.benefitEn : scheme.benefitHi;
  const description = isEn ? scheme.descriptionEn : scheme.descriptionHi;
  const whyEligible = isEn ? scheme.whyEligibleEn : scheme.whyEligibleHi;
  const requiredDocs = isEn ? scheme.requiredDocsEn : scheme.requiredDocsHi;

  const handleOpenPortal = async () => {
    try {
      if (scheme.officialUrl) {
        await Linking.openURL(scheme.officialUrl);
      }
    } catch (e) {
      console.warn('Cannot open official portal:', scheme.officialUrl);
    }
  };

  // Split eligibility criteria
  const eligibilityCriteria = whyEligible
    .split(/[|✓]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return (
    <View style={styles.container}>
      {/* 1. Clean Minimal Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color="#0A2540" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {isEn ? 'Scheme Details' : 'योजना विवरण'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.audioButton, isSpeaking && styles.audioButtonActive]}
          onPress={onToggleSpeech}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isSpeaking ? 'volume-high' : 'volume-medium-outline'}
            size={18}
            color={isSpeaking ? '#FFFFFF' : '#0A2540'}
          />
        </TouchableOpacity>
      </View>

      {/* 2. Clean Continuous Page Content (No Rainbows, No Icon Clutter) */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Meta: Category & 100% Eligible Badge */}
        <View style={styles.metaRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{categoryLabel}</Text>
          </View>

          {scheme.isEligible && (
            <View style={styles.eligibleBadge}>
              <Text style={styles.eligibleBadgeText}>
                {isEn ? '100% Eligible' : '100% पात्र'}
              </Text>
            </View>
          )}
        </View>

        {/* Scheme Title & Ministry */}
        <Text style={styles.schemeTitle}>{title}</Text>
        <Text style={styles.ministryText}>{ministry}</Text>

        {/* Financial Benefit (Clean Neutral Block, No Heavy Green Box) */}
        <View style={styles.benefitBlock}>
          <Text style={styles.benefitLabel}>
            {isEn ? 'DIRECT FINANCIAL BENEFIT' : 'सीधा आर्थिक लाभ'}
          </Text>
          <Text style={styles.benefitAmountText}>{benefitAmount}</Text>
          <Text style={styles.benefitSubText}>{benefit}</Text>
          {description ? (
            <Text style={styles.benefitDescText}>{description}</Text>
          ) : null}
        </View>

        <View style={styles.sectionDivider} />

        {/* SECTION 1: Why You Are Eligible */}
        {eligibilityCriteria.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isEn ? 'Why You Are Eligible' : 'आप क्यों पात्र हैं'}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {isEn
                ? 'Based on your verified citizen profile & land criteria'
                : 'आपकी सत्यापित नागरिक प्रोफाइल एवं भूमि विवरण के आधार पर'}
            </Text>

            <View style={styles.criteriaWrap}>
              {eligibilityCriteria.map((crit, idx) => (
                <View key={idx} style={styles.criteriaPill}>
                  <Text style={styles.criteriaPillText}>{crit}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.sectionDivider} />

        {/* SECTION 2: Required Documents */}
        {requiredDocs && requiredDocs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isEn ? 'Required Documents' : 'आवश्यक दस्तावेज'}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {isEn
                ? 'Carry verified copies of these documents to apply:'
                : 'आवेदन के लिए इन दस्तावेजों की सत्यापित प्रतियां आवश्यक हैं:'}
            </Text>

            <View style={styles.docList}>
              {requiredDocs.map((doc, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.docRow,
                    idx === requiredDocs.length - 1 && styles.docRowLast,
                  ]}
                >
                  <Text style={styles.docNumber}>{idx + 1}.</Text>
                  <Text style={styles.docNameText}>{doc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.sectionDivider} />

        {/* SECTION 3: Assistance Note */}
        <View style={styles.assistanceNote}>
          <Text style={styles.assistanceTitle}>
            {isEn ? 'Need Assistance with Application?' : 'आवेदन में सहायता चाहिए?'}
          </Text>
          <Text style={styles.assistanceDesc}>
            {isEn
              ? 'Carry these documents to your nearest Common Service Center (CSC) or e-Seva Kendra to apply with local sahayak guidance.'
              : 'इन दस्तावेजों को अपने नजदीकी कॉमन सर्विस सेंटर (CSC) या ई-सेवा केंद्र पर ले जाकर स्थानीय सहायक की मदद से सीधे आवेदन करें।'}
          </Text>
        </View>
      </ScrollView>

      {/* 3. Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={handleOpenPortal}
          activeOpacity={0.85}
        >
          <Text style={styles.applyButtonText}>
            {isEn ? 'Apply on Official Portal ↗' : 'आधिकारिक पोर्टल पर जाएं ↗'}
          </Text>
        </TouchableOpacity>

        {scheme.helplinePhone && (
          <TouchableOpacity
            style={styles.helplineButton}
            onPress={() => onCallHelpline(scheme.helplinePhone)}
            activeOpacity={0.8}
          >
            <Text style={styles.helplineButtonText}>
              {isEn ? 'Helpline' : 'हेल्पलाइन'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0A2540',
  },
  audioButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  audioButtonActive: {
    backgroundColor: '#0A2540',
    borderColor: '#0A2540',
  },
  scrollArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 90,
  },

  // Meta Badges
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  eligibleBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  eligibleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },

  // Title & Ministry
  schemeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 28,
    marginBottom: 6,
  },
  ministryText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },

  // Clean Financial Benefit Block
  benefitBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  benefitLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1565C0',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  benefitAmountText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  benefitSubText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 19,
    marginBottom: 4,
  },
  benefitDescText: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },

  // Section Divider
  sectionDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },

  // Sections
  section: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  sectionSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 12,
  },

  // Criteria Pills (Clean, no icons)
  criteriaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  criteriaPill: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  criteriaPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E293B',
  },

  // Document List (Clean numbered rows, no glowing icons)
  docList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  docRowLast: {
    borderBottomWidth: 0,
  },
  docNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    width: 20,
  },
  docNameText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '500',
    color: '#0F172A',
  },

  // Assistance Note (Neutral clean)
  assistanceNote: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  assistanceTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  assistanceDesc: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },

  // Fixed Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#1565C0',
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  helplineButton: {
    flex: 1,
    height: 48,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helplineButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
});
