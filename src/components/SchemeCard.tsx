import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '../utils/icons';
import { Scheme } from '../types';
import { SupportedLanguage } from '../i18n/translations';

interface SchemeCardProps {
  scheme: Scheme;
  onViewDocs: (scheme: Scheme) => void;
  currentLanguage?: SupportedLanguage;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({
  scheme,
  onViewDocs,
  currentLanguage = 'hi',
}) => {
  const isEn = currentLanguage === 'en';

  const title = isEn ? scheme.titleEn : scheme.titleHi;
  const categoryLabel = isEn
    ? (scheme.categoryLabelEn || scheme.category)
    : (scheme.categoryLabelHi || scheme.category);
  const benefit = isEn
    ? (scheme.benefitAmountEn || scheme.benefitAmount)
    : (scheme.benefitAmountHi || scheme.benefitAmount);

  const isEligible = Boolean(scheme.isEligible);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onViewDocs(scheme)}
      activeOpacity={0.88}
    >
      {/* Top Row: Category + Eligibility Tag (only if eligible) + Details Arrow */}
      <View style={styles.cardTop}>
        <View style={styles.categoryWrap}>
          <Text style={styles.categoryText}>{categoryLabel}</Text>
          {isEligible && (
            <View style={styles.eligibleBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#15803D" />
              <Text style={styles.eligibleBadgeText}>
                {isEn ? 'Eligible' : 'पात्र'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.detailsWrap}>
          <Text style={styles.detailsText}>{isEn ? 'Details' : 'विवरण'}</Text>
          <Ionicons name="chevron-forward" size={13} color="#0A2540" />
        </View>
      </View>

      {/* Scheme Title */}
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>

      {/* Benefit Amount */}
      <Text style={styles.benefitAmount}>{benefit}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  categoryText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  eligibleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  eligibleBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#15803D',
  },
  detailsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0A2540',
  },
  title: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 5,
  },
  benefitAmount: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#16A34A',
  },
});

