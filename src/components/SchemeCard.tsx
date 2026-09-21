import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '../utils/icons';
import { Colors } from '../theme/colors';
import { Scheme } from '../types';
import { SupportedLanguage } from '../i18n/translations';

interface SchemeCardProps {
  scheme: Scheme;
  onViewDocs: (scheme: Scheme) => void;
  isAudioEnabled?: boolean;
  currentLanguage?: SupportedLanguage;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({
  scheme,
  onViewDocs,
  currentLanguage = 'en',
}) => {
  const isEn = currentLanguage === 'en';

  const title = isEn ? scheme.titleEn : scheme.titleHi;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onViewDocs(scheme)}
      activeOpacity={0.75}
    >
      <View style={styles.mainCol}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {scheme.isEligible && (
          <View style={styles.eligiblePill}>
            <Ionicons name="checkmark-circle-outline" size={15} color="#16A34A" />
            <Text style={styles.eligiblePillText}>
              {isEn ? 'Eligible' : 'पात्र'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.arrowCircle}>
        <Ionicons name="chevron-forward" size={18} color="#EA580C" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 5,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 0,
    shadowOpacity: 0,
  },
  mainCol: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A2540',
    lineHeight: 21,
  },
  eligiblePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  eligiblePillText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '700',
  },
  arrowCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
});

