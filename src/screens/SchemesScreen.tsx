import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '../utils/icons';
import { Colors } from '../theme/colors';
import { Scheme } from '../types';
import { SchemeCard } from '../components/SchemeCard';
import { SupportedLanguage, translations } from '../i18n/translations';

interface SchemesScreenProps {
  schemes: Scheme[];
  onViewDocs: (scheme: Scheme) => void;
  currentLanguage?: SupportedLanguage;
}

export const SchemesScreen: React.FC<SchemesScreenProps> = ({
  schemes,
  onViewDocs,
  currentLanguage = 'hi',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const t = translations[currentLanguage];
  const isEn = currentLanguage === 'en';

  // Filter chips list
  const filterOptions = [
    { id: 'all', label: isEn ? 'All Schemes' : 'सभी योजनाएं' },
    { id: 'housing', label: isEn ? 'Housing' : 'आवास' },
    { id: 'farming', label: isEn ? 'Farming' : 'किसान' },
    { id: 'health', label: isEn ? 'Health' : 'स्वास्थ्य' },
    { id: 'education', label: isEn ? 'Education' : 'शिक्षा' },
    { id: 'business', label: isEn ? 'Business' : 'रोजगार' },
    { id: 'pension', label: isEn ? 'Pension' : 'पेंशन' },
  ];

  // Filtering schemes by search text & category pill
  const filteredSchemes = schemes.filter((s) => {
    const matchesCategory = activeFilter === 'all' || s.category === activeFilter;
    const matchesSearch =
      s.titleHi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.benefitHi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.benefitEn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={styles.container}>
      {/* 1. Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.blue.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t.searchPlaceholder}
            placeholderTextColor={Colors.white.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.orange.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. Category Filter Horizontal Pills */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filterOptions.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <TouchableOpacity
                key={filter.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(filter.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Results Count Bar */}
      <View style={styles.countBar}>
        <Text style={styles.countText}>
          {t.schemesFound(filteredSchemes.length)}
        </Text>
      </View>

      {/* 4. Schemes Vertical Scroll List */}
      <ScrollView
        style={styles.listArea}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredSchemes.length > 0 ? (
          filteredSchemes.map((scheme) => (
            <SchemeCard
              key={scheme.id}
              scheme={scheme}
              onViewDocs={onViewDocs}
              currentLanguage={currentLanguage}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={Colors.blue.primary} />
            <Text style={styles.emptyTitle}>
              {isEn ? 'No Schemes Found' : 'कोई योजना नहीं मिली'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isEn
                ? 'Try searching with another keyword'
                : 'कृपया कोई दूसरा नाम या श्रेणी खोजकर देखें'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white.canvas,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: Colors.white.pure,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.white.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.white.textDark,
  },
  filterWrapper: {
    backgroundColor: Colors.white.pure,
    borderBottomWidth: 1,
    borderBottomColor: Colors.white.border,
    paddingBottom: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.white.border,
  },
  filterChipActive: {
    backgroundColor: Colors.blue.dark,
    borderColor: Colors.blue.dark,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white.muted,
  },
  filterChipTextActive: {
    color: Colors.white.pure,
    fontWeight: '700',
  },
  countBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white.muted,
  },
  listArea: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 110,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.blue.dark,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.white.muted,
    marginTop: 4,
    textAlign: 'center',
  },
});
