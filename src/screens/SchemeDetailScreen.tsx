import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '../utils/icons';
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
  const categoryLabel = isEn
    ? (scheme.categoryLabelEn || scheme.category)
    : (scheme.categoryLabelHi || scheme.category);
  const benefitAmount = isEn
    ? (scheme.benefitAmountEn || scheme.benefitAmount)
    : (scheme.benefitAmountHi || scheme.benefitAmount);
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

  // Split eligibility criteria cleanly
  const eligibilityCriteria = whyEligible
    ? whyEligible
        .split(/[|✓]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [];

  return (
    <View style={styles.container}>
      {/* 1. Header: Pure minimal icons without surrounding boxes */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={onBack}
          activeOpacity={0.6}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color="#0A2540" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {isEn ? 'Scheme Details' : 'योजना विवरण'}
        </Text>

        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={onToggleSpeech}
          activeOpacity={0.6}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons
            name={isSpeaking ? 'volume-high' : 'volume-medium-outline'}
            size={24}
            color={isSpeaking ? '#16A34A' : '#0A2540'}
          />
        </TouchableOpacity>
      </View>

      {/* 2. Scrollable Body: Clean, text-focused, no icon clutter */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Card: Home page 'For You' style */}
        <View style={styles.heroCard}>
          <View style={styles.heroCardTop}>
            <Text style={styles.categoryText}>{categoryLabel}</Text>
            {scheme.isEligible && (
              <View style={styles.eligibleBadge}>
                <Text style={styles.eligibleBadgeText}>
                  {isEn ? 'Eligible' : 'पात्र'}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.schemeTitle}>{title}</Text>
          {ministry ? <Text style={styles.ministryText}>{ministry}</Text> : null}

          {/* Clean Benefit Highlight */}
          <View style={styles.benefitContainer}>
            <Text style={styles.benefitAmountText}>{benefitAmount}</Text>
            {benefit ? <Text style={styles.benefitSubText}>{benefit}</Text> : null}
          </View>
        </View>

        {/* Section: Overview / Description (if available) */}
        {description ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>
              {isEn ? 'Overview' : 'विवरण'}
            </Text>
            <Text style={styles.bodyText}>{description}</Text>
          </View>
        ) : null}

        {/* Section: Eligibility Criteria (Clean text list) */}
        {eligibilityCriteria.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>
              {isEn ? 'Eligibility' : 'पात्रता'}
            </Text>
            <View style={styles.listWrap}>
              {eligibilityCriteria.map((crit, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{crit}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Section: Required Documents (Clean numbered list, no icon overload) */}
        {requiredDocs && requiredDocs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>
              {isEn ? 'Required Documents' : 'आवश्यक दस्तावेज़'}
            </Text>
            <View style={styles.listWrap}>
              {requiredDocs.map((doc, idx) => (
                <View key={idx} style={styles.numberedRow}>
                  <Text style={styles.numberLabel}>{idx + 1}.</Text>
                  <Text style={styles.numberedText}>{doc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Section: Assistance Note (Clean simple text, no heavy container) */}
        <View style={styles.assistanceSection}>
          <Text style={styles.assistanceHeading}>
            {isEn ? 'Need Assistance?' : 'आवेदन में सहायता चाहिए?'}
          </Text>
          <Text style={styles.assistanceBody}>
            {isEn
              ? 'Visit your nearest Common Service Center (CSC) or e-Seva Kendra with the above documents.'
              : 'इन दस्तावेज़ों के साथ अपने नज़दीकी कॉमन सर्विस सेंटर (CSC) या ई-सेवा केंद्र पर जाएं।'}
          </Text>
        </View>
      </ScrollView>

      {/* 3. Bottom Sticky Bar: Clean & Focused Action */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.applyBtn}
          onPress={handleOpenPortal}
          activeOpacity={0.85}
        >
          <Text style={styles.applyBtnText}>
            {isEn ? 'Apply on Official Portal ↗' : 'आधिकारिक पोर्टल पर जाएं ↗'}
          </Text>
        </TouchableOpacity>

        {scheme.helplinePhone ? (
          <TouchableOpacity
            style={styles.helplineBtn}
            onPress={() => onCallHelpline(scheme.helplinePhone!)}
            activeOpacity={0.7}
          >
            <Text style={styles.helplineBtnText}>
              {isEn ? 'Helpline' : 'हेल्पलाइन'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // 1. Header: Clean & minimal
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 48,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerIconBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0A2540',
  },

  // 2. Body
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },

  // Hero Card (Like Home Page Card)
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  heroCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  eligibleBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  eligibleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  schemeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 24,
    marginBottom: 4,
  },
  ministryText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  benefitContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  benefitAmountText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A2540',
    marginBottom: 2,
  },
  benefitSubText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },

  // Content Sections
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#334155',
  },

  // Lists (Pure text bullets & numbers, NO icons)
  listWrap: {
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  bulletText: {
    flex: 1,
    fontSize: 13.5,
    color: '#334155',
    lineHeight: 20,
  },
  numberedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  numberLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#64748B',
    width: 20,
    lineHeight: 20,
  },
  numberedText: {
    flex: 1,
    fontSize: 13.5,
    color: '#334155',
    lineHeight: 20,
  },

  // Assistance Note
  assistanceSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  assistanceHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  assistanceBody: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
  },

  // 3. Bottom Sticky Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 12 : 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  applyBtn: {
    flex: 2,
    backgroundColor: '#0A2540',
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  helplineBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helplineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0A2540',
  },
});
