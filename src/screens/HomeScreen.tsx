import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Scheme, SchemeCategory } from '../types';
import { CategoryGrid } from '../components/CategoryGrid';
import { SchemeCard } from '../components/SchemeCard';
import { SupportedLanguage, translations } from '../i18n/translations';

interface HomeScreenProps {
  categories: SchemeCategory[];
  schemes: Scheme[];
  onStartVoiceChat: () => void;
  onViewDocs: (scheme: Scheme) => void;
  currentLanguage?: SupportedLanguage;
  headerComponent?: React.ReactNode;
}

const COLLAPSE_DISTANCE = 266;
const TOTAL_HEADER_HEIGHT = 386;

export const HomeScreen: React.FC<HomeScreenProps> = ({
  categories,
  schemes,
  onStartVoiceChat,
  onViewDocs,
  currentLanguage = 'en',
  headerComponent,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const t = translations[currentLanguage];
  const isEn = currentLanguage === 'en';

  const displayedSchemes = selectedCategory
    ? schemes.filter((s) => s.category === selectedCategory)
    : schemes;

  const handleCategoryPress = (catId: string) => {
    setSelectedCategory((prev) => (prev === catId ? null : catId));
  };

  const handleCallHelpline = () => {
    Linking.openURL('tel:1551');
  };

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, COLLAPSE_DISTANCE],
    outputRange: [0, -COLLAPSE_DISTANCE],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* 1. Collapsible Header & Sticky Categories Section */}
      <Animated.View
        style={[
          styles.stickyTopWrapper,
          { transform: [{ translateY: headerTranslateY }] },
        ]}
      >
        {/* Top Scrolling Header on Home */}
        {headerComponent}

        {/* Sleek AI Voice Search Banner */}
        <View style={[styles.voiceBanner, headerComponent ? { marginTop: 14 } : null]}>
          <View style={styles.voiceTextContainer}>
            <Text style={styles.voiceBadge}>{isEn ? '✦ Mitra AI' : '✦ मित्र AI'}</Text>
            <Text style={styles.voiceTitle}>
              {isEn ? 'Find Welfare Schemes' : 'सरकारी योजनाएं खोजें'}
            </Text>
            <Text style={styles.voiceExample}>
              {isEn ? 'Speak in any language' : 'किसी भी भाषा में बोलें'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.voiceMicButton}
            onPress={onStartVoiceChat}
            activeOpacity={0.8}
          >
            <Ionicons name="mic" size={22} color={Colors.orange.primary} />
          </TouchableOpacity>
        </View>

        {/* Sticky Category Section (Free to scroll horizontally with full native speed!) */}
        <View style={styles.stickyCategorySection}>
          <View style={styles.categoryHeaderRow}>
            <Text style={styles.sectionTitle}>
              {isEn ? 'Categories' : 'श्रेणियां'}
            </Text>
            {selectedCategory && (
              <TouchableOpacity
                onPress={() => setSelectedCategory(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.resetButtonText}>
                  {isEn ? 'Show All' : 'सभी दिखाएं'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <CategoryGrid
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategoryPress}
            currentLanguage={currentLanguage}
          />
        </View>
      </Animated.View>

      {/* 2. Scrollable Schemes Section */}
      <Animated.ScrollView
        style={styles.schemesScrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <View style={styles.schemesContainer}>
          <View style={[styles.sectionHeader, { marginTop: 6 }]}>
            <Text style={styles.sectionTitle}>
              {selectedCategory
                ? (isEn ? 'Filtered Schemes' : 'चयनित योजनाएं')
                : (isEn ? 'Recommended for You' : 'आपके लिए योजनाएं')}
            </Text>
            <Text style={styles.schemeCountBadge}>{displayedSchemes.length}</Text>
          </View>

          {/* Scheme Cards */}
          {displayedSchemes.map((scheme) => (
            <SchemeCard
              key={scheme.id}
              scheme={scheme}
              onViewDocs={onViewDocs}
              currentLanguage={currentLanguage}
            />
          ))}

          {/* Helpline Strip */}
          <TouchableOpacity
            style={styles.helplineStrip}
            onPress={handleCallHelpline}
            activeOpacity={0.85}
          >
            <Ionicons name="call-outline" size={18} color={Colors.blue.primary} />
            <Text style={styles.helplineText}>
              {isEn ? 'Toll-Free Helpline: 1551' : 'निशुल्क हेल्पलाइन: 1551'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.orange.primary} />
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  stickyTopWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: '#F8FAFC',
  },
  schemesScrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: TOTAL_HEADER_HEIGHT,
    paddingBottom: 110,
  },
  voiceBanner: {
    backgroundColor: Colors.orange.primary,
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 0,
    shadowOpacity: 0,
  },
  voiceTextContainer: {
    flex: 1,
    paddingRight: 12,
    gap: 2,
  },
  voiceBadge: {
    fontSize: 10,
    color: '#FFF7ED',
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  voiceTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white.pure,
  },
  voiceExample: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.90)',
    fontWeight: '500',
  },
  voiceMicButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white.pure,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 0,
    shadowOpacity: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  schemeCountBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.blue.primary,
    backgroundColor: Colors.blue.light,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.blue.primary,
  },
  helplineStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 0,
    shadowOpacity: 0,
  },
  helplineText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.blue.dark,
    flex: 1,
  },
  stickyCategorySection: {
    backgroundColor: '#F8FAFC',
    paddingTop: 10,
    paddingBottom: 8,
    zIndex: 10,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  schemesContainer: {
    paddingTop: 2,
  },
});
